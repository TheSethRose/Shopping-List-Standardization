<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Walmart Purchase History Analyzer

I scraped every receipt from my entire Walmart history and built a small AI tool to map what my family means when they yell, "Alexa, add breakfast sandwiches!" to the items we buy most often. Boom. The most convenient way known to man to blow $200. 😭

## What It Does

Upload your Walmart purchase history and enter your shopping list. The app uses Gemini AI to:

- **Semantic Matching**: Expands vague items like "breakfast sandwiches" into actual product searches ("sausage biscuit", "Jimmy Dean", "bacon croissant")
- **Frequency Analysis**: Finds products you've purchased most often
- **Smart Suggestions**: Ranks matches by purchase frequency so you get the exact products your household actually buys

Perfect for when "get the good cheese" needs to become "Great Value Shredded Sharp Cheddar 32oz" because that's apparently what we buy.

## Features

- 📁 Upload CSV or Excel files from Walmart order exports
- 🔍 AI-powered semantic expansion of shopping list items
- 📊 Purchase frequency analysis across your entire order history
- 🔗 Direct links to products on Walmart.com
- ✨ Clean, dark-themed UI

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Gemini AI (`@google/genai`)
- PapaParse (CSV parsing)
- XLSX (Excel parsing)
- Lucide React (icons)

## Getting Your Walmart Purchase History

1. Log into your Walmart account
2. Go to **Account** → **Purchase History**
3. Export your order data as CSV or use browser dev tools to scrape it
4. Upload the file to this app

---

Built with AI Studio • [View in AI Studio](https://ai.studio/apps/drive/1OzMgPpma7-3PZWPv7USnEUfTS_q_kpmQ)
