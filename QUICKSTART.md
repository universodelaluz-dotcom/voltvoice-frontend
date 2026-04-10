# VoltVoice Landing Page - Quick Start Guide

Get your professional landing page running in minutes.

## Start Development Server

```bash
cd landing-page
npm run dev
```

Visit http://localhost:3000 in your browser.

## Project Structure

```
landing-page/
├── app/                          # App directory (Next.js 14)
│   ├── page.tsx                  # Home page
│   ├── pricing/page.tsx          # Pricing page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── Navbar.tsx                # Navigation (mobile-responsive)
│   ├── Hero.tsx                  # Hero section
│   ├── Features.tsx              # 6 feature cards
│   ├── Pricing.tsx               # 3-tier pricing
│   ├── CTA.tsx                   # Call-to-action
│   └── Footer.tsx                # Footer with links
│
├── public/                       # Static assets
│   └── robots.txt               # SEO robots file
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── next.config.js                # Next.js config
├── vercel.json                   # Vercel deployment config
└── .vercelignore                 # Files to ignore on deploy
```

## Key Features Implemented

✓ Neon gradient design (cyan, magenta, purple, yellow)
✓ Dark theme with animated background
✓ Mobile-responsive navigation
✓ Hero section with CTA buttons
✓ 6 professional feature cards
✓ 3-tier pricing table (Free, Pro, Enterprise)
✓ Call-to-action section
✓ Footer with social links
✓ Smooth animations and hover effects
✓ Production-ready build (104 KB First Load JS)
✓ SEO optimized

## Customize Content

### Edit Brand Text

**Hero Section** - `components/Hero.tsx`:
- Main heading
- Subheading
- Trust indicators

**Features** - `components/Features.tsx`:
- Feature titles
- Descriptions
- Icons

**Pricing** - `components/Pricing.tsx`:
- Plan names
- Prices
- Features list

**Footer** - `components/Footer.tsx`:
- Company info
- Links
- Contact info

### Change Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  voltvoice: {
    cyan: '#00D9FF',    // Change here
    magenta: '#FF006E', // Change here
    purple: '#7209B7',  // Change here
    yellow: '#FFD60A',  // Change here
    dark: '#0A0E27',    // Change here
  },
}
```

### Add New Pages

1. Create `app/[page-name]/page.tsx`
2. Add navigation link in `components/Navbar.tsx`
3. Reuse components as needed

## Build for Production

```bash
npm run build    # Creates optimized build
npm start        # Starts production server
```

## Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

or connect GitHub repo to Vercel Dashboard.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://voltvoice.app
NEXT_PUBLIC_API_URL=https://api.voltvoice.app
```

## Performance Metrics

Current build:
- **First Load JS**: 104 kB (optimized)
- **Static Pages**: All pre-rendered
- **Build Time**: ~30 seconds
- **Bundle Size**: Minimal

## Available Scripts

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Need Help?

1. Check `README.md` for detailed docs
2. Check `DEPLOYMENT.md` for deployment guide
3. See `tailwind.config.ts` for theme customization
4. Review component files for specific features

## Next Steps

1. Replace demo text with your content
2. Update colors/branding if needed
3. Add your logo/images
4. Deploy to Vercel
5. Set up custom domain
6. Configure analytics

## Tech Stack Summary

- **Framework**: Next.js 14.2.35 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.3
- **Icons**: Lucide React
- **Deploy**: Vercel (or any Node.js host)

Happy building! 🚀
