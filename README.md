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
- Creates new accounts (`sacc1` to `sacc1500`) and logs in automatically.
- Includes a help panel with reset, credit, and quick search.

Steps to Activate

1. Install [Tampermonkey](https://www.tampermonkey.net/) on your browser.
2. On the top right hand, click bookmarks and pin tampermonkey
3. Click the tampermonkey button, create a new script, and paste the script and save
4. Visit [https://www.nationstates.net](https://www.nationstates.net) — the script activates automatically.

## 🛠️ Configuration

- Password(adjustable): Stored in-script as `Password`
- Account Prefix(adjustable): `USER`
- Max accounts(adjustable) 1500 - NationStates has an inbuilt function preventing excess accounts so only able to create 50-100 a day.

You can adjust these constants directly in the script.

Trading Card Counter

The script keeps a persistent count of:
- Common
- Uncommon
- Rare
- Ultra-rare
- Epic
- Legendary

Also shows which accounts specifically hold legendary cards.

Author

Ashok Joseph

---
Disclaimer:
This project is an independent, fan-made userscript and is not affiliated with, endorsed, or supported by NationStates or its creators. Use of this script is at your own risk, and you should comply with NationStates’ site rules and terms of service.
