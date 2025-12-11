# USDC Fixed-Fee Hook Landing Page - Setup Instructions

## Setup Complete!

The Next.js landing page has been successfully configured with all the v0 components.

## What Was Done

1. **Created App Directory Structure**
   - `/src/app/page.tsx` - Main landing page with all components
   - `/src/app/layout.tsx` - Root layout with metadata and Analytics
   - `/src/app/globals.css` - Global styles with Tailwind CSS configuration

2. **Verified Components**
   All v0 components are present and properly configured:
   - Header (with mobile menu)
   - Hero (with statistics)
   - Features (with comparison table and placeholders for images)
   - HowItWorks (with interactive balance simulator)
   - Benefits (for institutions, retail users, and developers)
   - Calculator (fixed fee calculator)
   - CTA (call-to-action section)
   - Footer (with links and company info)

3. **Updated Dependencies**
   - Added `@radix-ui/react-slot` to package.json (required by Button component)

## Next Steps

### 1. Install Dependencies

```bash
cd /Users/diegolden/Code/Odisea/usdc-fees-hook/web
npm install
```

### 2. Add Missing Images (Optional)

The Features component currently has placeholders for two images. To add them:

Create the `/public/images/` directory and add:
- `vitalik-gas-futures-tweet.png` - Screenshot of Vitalik's tweet about gas futures
- `adam-tweet.png` - Screenshot of Adam's tweet about stablecoin payments

Then update `/src/components/features.tsx` to use the actual images instead of placeholders (lines 78-96).

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

### 5. Start Production Server

```bash
npm start
```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main landing page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── header.tsx        # Header component
│   │   ├── hero.tsx          # Hero section
│   │   ├── features.tsx      # Features section
│   │   ├── how-it-works.tsx  # How It Works section
│   │   ├── benefits.tsx      # Benefits section
│   │   ├── calculator.tsx    # Fee calculator
│   │   ├── cta.tsx           # Call-to-action
│   │   ├── footer.tsx        # Footer
│   │   └── ui/
│   │       └── button.tsx    # Button UI component
│   └── lib/
│       └── utils.ts          # Utility functions
├── public/
│   └── .gitkeep              # Placeholder for images directory
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

## Features

- **Responsive Design**: Mobile-first approach with responsive components
- **Dark Mode Support**: Built-in dark mode support via Tailwind CSS
- **SEO Optimized**: Proper metadata and Open Graph tags
- **Analytics**: Vercel Analytics integration
- **Interactive Components**: Balance simulator and fee calculator
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS

## Customization

### Colors

The color scheme is defined in `src/app/globals.css` using CSS variables. You can customize:
- Primary color (blue): Used for buttons and accents
- Accent color (green): Used for highlights and success states
- Background, foreground, and muted colors

### Content

All text content is hardcoded in the components. You can easily update:
- Hero section statistics (in `hero.tsx`)
- Feature descriptions (in `features.tsx`)
- Benefit lists (in `benefits.tsx`)
- Footer links (in `footer.tsx`)

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Make sure all dependencies are installed: `npm install`
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`

### Missing Types

If TypeScript complains about missing types:

```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## Support

For issues related to the landing page, check:
1. Console for JavaScript errors
2. Network tab for failed requests
3. Next.js build output for compilation errors
