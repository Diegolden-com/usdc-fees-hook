# Quick Start Guide

## Get Up and Running in 3 Steps

### Step 1: Install Dependencies
```bash
cd /Users/diegolden/Code/Odisea/usdc-fees-hook/web
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: `http://localhost:3000`

---

## What You'll See

A fully functional landing page with:
- Responsive header with mobile menu
- Hero section with key statistics
- Features comparison table
- Interactive balance simulator
- Fee calculator
- Benefits for different user types
- Call-to-action section
- Footer with links

---

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main landing page
│   │   ├── layout.tsx        # Root layout with metadata
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── header.tsx
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── how-it-works.tsx
│   │   ├── benefits.tsx
│   │   ├── calculator.tsx
│   │   ├── cta.tsx
│   │   ├── footer.tsx
│   │   └── ui/button.tsx
│   └── lib/utils.ts
└── package.json
```

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## Optional: Add Images

The Features section has placeholders for two images:

1. Create directory: `mkdir -p public/images`
2. Add images:
   - `public/images/vitalik-gas-futures-tweet.png`
   - `public/images/adam-tweet.png`
3. Update `src/components/features.tsx` (lines 78-96) to use real images

---

## Technology Stack

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Typography**: Inter (Google Fonts)
- **Analytics**: Vercel Analytics

---

## Need Help?

- See `SETUP_INSTRUCTIONS.md` for detailed setup guide
- See `CHANGES.md` for complete list of changes made
- Check Next.js docs: https://nextjs.org/docs
- Check Tailwind docs: https://tailwindcss.com/docs
