// ==UserScript==
// @name         NS
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Resolves issues, opens card packs, switches accts, creates accts, and contains a dynamic counter of card rarities over all accts
// @author       Ashok Joseph
// @match        https://www.nationstates.net/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PASSWORD = 'Password123';
    const MAX_ACCOUNTS = 300;
    const baseNation = 'USER';

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const rarityCounts = JSON.parse(localStorage.getItem('rarityCounts')) || {
        common: 0,
        uncommon: 0,
        rare: 0,
        'ultra-rare': 0,
        epic: 0,
        legendary: 0
    };

    const legendaryOwners = new Set(JSON.parse(localStorage.getItem('legendaryOwners')) || []);

    const updateLocalStorage = () => {
        localStorage.setItem('rarityCounts', JSON.stringify(rarityCounts));
        localStorage.setItem('legendaryOwners', JSON.stringify([...legendaryOwners]));
    };

    const getNationNumber = () => {
        const nationLink = document.querySelector('a.bellink.quietlink.shortname');
        if (nationLink) {
            const match = nationLink.textContent.match(/USER(\d+)/i);
            if (match) return parseInt(match[1]);
        }
        const stored = localStorage.getItem('nationCounter');
        return stored ? parseInt(stored) : 1;
    };

    let currentNationNumber = getNationNumber();
    localStorage.setItem('nationCounter', currentNationNumber);

    const goTo = (url) => window.location.href = url;

    const handleDilemmas = () => {
        const dilemmaLink = document.querySelector('.dilemmalist li a.silentlink');
        dilemmaLink ? goTo(dilemmaLink.href) : goTo('/page=deck');
    };

    const handleIssue = () => {
        const firstOption = document.querySelector('button[name^="choice-"]');
        if (firstOption) firstOption.click();
    };

    const updateStatsDisplay = () => {
        let container = document.querySelector('#cardStatsOverlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'cardStatsOverlay';
            container.style.position = 'fixed';
            container.style.bottom = '10px';
            container.style.right = '10px';
            container.style.backgroundColor = '#222';
            container.style.color = 'white';
            container.style.padding = '10px';
            container.style.zIndex = '9999';
            container.style.fontFamily = 'monospace';
            container.style.border = '1px solid white';
            container.style.minWidth = '250px';
            document.body.appendChild(container);
        }

        const stats = Object.entries(rarityCounts).map(([rarity, count]) => `${rarity}: ${count}`).join('<br>');
        const legends = [...legendaryOwners].join(', ') || 'None';

        container.innerHTML = `
            <strong>Card Counts:</strong><br>${stats}
            <br><br><strong>Legendaries Held By:</strong><br>${legends}
            <br><br>
            <button id="resetCounter">Reset Counter</button>
            <br><br>
            <button id="helpToggle">Help?</button>
            <div id="helpMenu" style="display:none; margin-top: 10px;">
                <button id="searchBtn">Search for Account</button><br><br>
                <button id="creditBtn">Credit</button>
                <div id="creditText" style="display:none; margin-top: 5px;">Script by Ashok Joseph</div>
            </div>
        `;

        document.querySelector('#resetCounter').onclick = () => {
            if (confirm('Are you sure you want to reset the rarity counter?')) {
                localStorage.removeItem('rarityCounts');
                localStorage.removeItem('legendaryOwners');
                updateStatsDisplay();
                location.reload();
            }
        };

        document.querySelector('#helpToggle').onclick = () => {
            const help = document.querySelector('#helpMenu');
            help.style.display = help.style.display === 'none' ? 'block' : 'none';
        };

        document.querySelector('#searchBtn').onclick = () => {
            const acct = prompt("Enter account name (e.g., USER1):");
            if (acct) window.location.href = `https://www.nationstates.net/nation=${acct}`;
        };

        document.querySelector('#creditBtn').onclick = () => {
            const credit = document.querySelector('#creditText');
            credit.style.display = credit.style.display === 'none' ? 'block' : 'none';
        };
    };

    const countCardsOnDeckPage = () => {
        const cards = document.querySelectorAll('.deckcard-container figure.front');
        const thisNation = `USER${currentNationNumber}`;

        cards.forEach(card => {
            const classList = card.classList;
            for (let cls of classList) {
                if (cls.startsWith('deckcard-category-')) {
                    const rarity = cls.replace('deckcard-category-', '');
                    if (rarityCounts.hasOwnProperty(rarity)) {
                        rarityCounts[rarity]++;
                        if (rarity === 'legendary') legendaryOwners.add(thisNation);
                    }
                }
            }
        });

        updateLocalStorage();
        updateStatsDisplay();
    };

    const handleDeck = async () => {
        await delay(1000);
        countCardsOnDeckPage();

        let packsLeft = parseInt(localStorage.getItem('packsRemaining')) || null;

        if (packsLeft === null) {
            const text = document.body.innerText;
            const match = text.match(/You have (\d+) unopened packs!/) || (text.includes("You have a new pack!") ? [null, 1] : null);
            packsLeft = match ? parseInt(match[1]) : 0;
            localStorage.setItem('packsRemaining', packsLeft);
        }

        if (packsLeft <= 0) {
            localStorage.removeItem('packsRemaining');
            switchAccount();
            return;
        }

        const packButton = document.querySelector('button.lootboxbutton');
        if (packButton) {
            packButton.click();
            await delay(2000);
        }

        let cards = [];
        for (let i = 0; i < 10; i++) {
            cards = document.querySelectorAll('.deckcard-container figure.back');
            if (cards.length > 0) break;
            await delay(500);
        }

        if (cards.length > 0) {
            cards.forEach((card, index) => {
                setTimeout(() => card.click(), index * 200);
            });

            await delay(cards.length * 200 + 1000);
        }

        packsLeft--;
        localStorage.setItem('packsRemaining', packsLeft);

        if (packsLeft > 0) {
            goTo('/page=deck');
        } else {
            localStorage.removeItem('packsRemaining');
            switchAccount();
        }
    };

    const switchAccount = async () => {
        if (currentNationNumber >= MAX_ACCOUNTS) return;
        const switchLink = document.querySelector('a.bellink[href="/page=login"]');
        if (switchLink) {
            switchLink.click();
            await delay(1500);

            const nationInput = document.querySelector('input[name="nation"]');
            const passInput = document.querySelector('input[name="password"]');
            const submitBtn = document.querySelector('button[type="submit"], button[name="submit"]');

            if (nationInput && passInput && submitBtn) {
                currentNationNumber++;
                localStorage.setItem('nationCounter', currentNationNumber);
                nationInput.value = `${baseNation}${currentNationNumber}`;
                passInput.value = PASSWORD;
                submitBtn.click();
            }
        }
    };

    const checkNationExistence = () => {
        if (document.body.innerText.includes('There is no record of a nation known as')) {
            localStorage.setItem('nationCounter', currentNationNumber + 1);
            goTo('/page=create_nation');
        }
    };

    const handleNationCreation = async () => {
        await delay(1000);
        const nextBtn = document.querySelector('input[name="submitbutton"]');
        if (nextBtn) return nextBtn.click();

        const nationToCreate = localStorage.getItem('nationCounter') || currentNationNumber;

        const nameInput = document.querySelector('input[name="name"]');
        const passInput = document.querySelector('input[placeholder="Password..."]');
        const confirmInput = document.querySelector('input[name="confirm_password"]');
        const checkbox = document.querySelector('input[name="legal"]');
        const dice = document.querySelectorAll('.random-dice:not(#random-name)');
        const createBtn = document.querySelector('button[name="create_nation"]');

        if (nameInput && passInput && confirmInput && checkbox && createBtn) {
            nameInput.value = `${baseNation}${parseInt(nationToCreate) + 1}`;
            passInput.value = PASSWORD;
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            confirmInput.value = PASSWORD;
            confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
            checkbox.checked = true;

            dice.forEach((die, index) => {
                if (index !== 0) die.click();
            });

            await delay(500);
            createBtn.click();
        }
    };

    const url = window.location.href;
    if (url.includes('/nation=')) goTo('/page=dilemmas');
    else if (url.includes('/page=dilemmas')) handleDilemmas();
    else if (url.includes('/page=show_dilemma')) handleIssue();
    else if (url.includes('/page=enact_dilemma')) goTo('/page=dilemmas');
    else if (url.includes('/page=deck')) handleDeck();
    else if (url.includes('/page=login')) checkNationExistence();
    else if (url.includes('/page=create_nation')) handleNationCreation();
    else checkNationExistence();
})();
