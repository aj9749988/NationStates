// ==UserScript==
// @name         NS COMPLETE
// @namespace    http://tampermonkey.net/
// @version      2.6.2
// @description  Resolves issues, opens card packs, switches accts, creates accts, restores inactive/ceased nations, auto-gifts legendaries to MAIN_ACCOUNT before switching, with resettable UI overlay
// @author       Ashok Joseph
// @match        https://www.nationstates.net/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PASSWORD = 'Password';
    const MAX_ACCOUNTS = 1500;
    const baseNation = 'User';
    const MAIN_ACCOUNT = 'Main';
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
            const match = nationLink.textContent.match(/account(\d+)/i);
            if (match) return parseInt(match[1]);
        }
        const urlMatch = window.location.href.match(/nation=account(\d+)/i);
        if (urlMatch) return parseInt(urlMatch[1]);
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
            <br><br><button id="resetOverlay">Reset Stats</button>
        `;
        const resetBtn = document.querySelector('#resetOverlay');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("Reset rarity + legendary counters?")) {
                    localStorage.removeItem('rarityCounts');
                    localStorage.removeItem('legendaryOwners');
                    location.reload();
                }
            };
        }
    };

    const countCardsOnDeckPage = () => {
        const cards = document.querySelectorAll('.deckcard-container figure.front');
        const thisNation = `account${currentNationNumber}`;
        cards.forEach(card => {
            for (let cls of card.classList) {
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

    const getBank = () => {
        const el = document.querySelector('#deck-bank');
        return el ? parseFloat(el.textContent.trim()) : 0.0;
    };
    const junkUntilOne = async () => {
        let bank = getBank();
        if (bank >= 1.0) return true;
        const junkBtns = [...document.querySelectorAll('.deckcard-junk-button')]
            .filter(b => b.dataset.rarity !== 'legendary')
            .map(b => ({ el: b, value: parseFloat(b.dataset.junkprice), rarity: b.dataset.rarity }))
            .sort((a, b) => a.value - b.value);
        for (let { el, value, rarity } of junkBtns) {
            const origConfirm = window.confirm;
            window.confirm = () => true;
            el.click();
            window.confirm = origConfirm;
            await delay(800);
            bank = getBank();
            if (bank >= 1.0) return true;
        }
        return false;
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
        if (packsLeft > 0) {
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
                cards.forEach((card, index) => setTimeout(() => card.click(), index * 200));
                await delay(cards.length * 200 + 1000);
            }
            packsLeft--;
            localStorage.setItem('packsRemaining', packsLeft);
            if (packsLeft > 0) { goTo('/page=deck'); return; }
            else { localStorage.removeItem('packsRemaining'); goTo('/page=deck'); return; }
        }

        const legendary = document.querySelector('.deckcard-junk-button[data-rarity="legendary"]');
        if (legendary) {
            const success = await junkUntilOne();
            if (success) {
                const cardLink = legendary.closest('.deckcard-info-content')
                                          .querySelector('.deckcard-info-cardnumber a');
                if (cardLink) { window.location.href = cardLink.href; return; }
            }
        } else {
            switchAccount();
        }
    };

    if (window.location.href.includes("/page=deck/card=") && !window.location.href.includes("gift=1")) {
        const errorEl = document.querySelector("p.error");
        if (errorEl) {
            window.location.href = "/page=deck";
        } else {
            const giftLink = document.querySelector('a.button[href*="/gift=1"]');
            if (giftLink) window.location.href = giftLink.href;
        }
    }

    if (window.location.href.includes("gift=1")) {
        (async () => {
            const input = document.querySelector('#entity_name');
            const btn = document.querySelector('button[name="send_gift"]');
            if (input && btn) {
                input.focus();
                input.value = MAIN_ACCOUNT;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'z' }));
                input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'z' }));
                await delay(800);
                btn.click();
                setTimeout(() => window.location.href = "/page=deck", 2000);
            }
        })();
    }

    const clickDeckValueLink = () => {
        const valueLink = Array.from(document.querySelectorAll('p')).find(p =>
            p.textContent.includes('Deck value') && p.querySelector('a[href="/page=deck"]')
        )?.querySelector('a[href="/page=deck"]');
        if (valueLink) valueLink.click();
    };
    const switchAccount = async () => {
        if (currentNationNumber >= MAX_ACCOUNTS) return;
        const switchLink = document.querySelector('a.bellink[href="/page=login"]');
        if (switchLink) {
            clickDeckValueLink();
            switchLink.click();
            await delay(1000);
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
