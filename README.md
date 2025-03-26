# NationStates AutoManager Userscript

This Tampermonkey userscript automates NationStates tasks such as:
- Resolving issues
- Opening card packs
- Switching between multiple accounts
- Creating new accounts
- Tracking card rarities dynamically across sessions

## 📦 Features

- Automatically handles dilemmas and enacts decisions.
- Opens and flips card packs with delays and animations.
- Tracks card rarity totals and stores across sessions.
- Displays a floating UI overlay with stats, search, and credit.
- Creates new accounts (`sacc1` to `sacc300`) and logs in automatically.
- Includes a help panel with reset, credit, and quick search.

Steps to Activate

1. Install [Tampermonkey](https://www.tampermonkey.net/) on your browser.
2. On the top right hand, click bookmarks and pin tampermonkey
3. Click the tampermonkey button, create a bew script, and paste the script and save
4. Visit [https://www.nationstates.net](https://www.nationstates.net) — the script activates automatically.

## 🛠️ Configuration

- Password: Stored in-script as `Password123`
- Account Prefix: `USER`
- Max accounts(adjustable) 300 - NationStates has an inbuilt function preventing excess accounts so only create 25 a day.

You can adjust these constants directly in the script.

Trading Card Counter

The script keeps a persistent count of:
- Common
- Uncommon
- Rare
- Ultra-rare
- Epic
- Legendary

Also shows which accounts hold legendary cards.

Author

Ashok Joseph

---

Please note - The script is currently under development; the current version autoselects the first choice for each issue and then opens any packs earned. I am working on a version that tests all the choices within the issues to determine if any packs have higher pack success rates. Also, this hack was created for educational purposes, not intended to be exploited in-game. Enjoy! :)
