# VoltVoice Landing Page - Complete Setup Guide

Professional Next.js landing page for TikTok streamers. Production-ready and fully deployable.

## Project Overview

A modern, responsive landing page built with Next.js 14, TypeScript, and Tailwind CSS featuring:
- Neon aesthetic with cyan, magenta, purple, and yellow gradients
- Dark professional theme
- Mobile-first responsive design
- Smooth animations and hover effects
- SEO optimized
- Deploy-ready configuration

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn/pnpm)
- **Disk Space**: ~500MB (including node_modules)
- **OS**: Windows, macOS, or Linux

## Installation & Setup

### Step 1: Navigate to Project

```bash
cd "/c/Nueva carpeta/VOLTVOICE 6000000 m23/VOLTVOICE 6000000/VOLTVOICE x 2/VOLTVOICE/landing-page"
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14.0.0
- React 18.2.0
- TypeScript 5.3.0
- Tailwind CSS 3.3.0
- Lucide React (icons)
- And supporting libraries

**Installation Time**: ~2-3 minutes

### Step 3: Verify Installation

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
Route (app)                Size     First Load JS
├ ○ /                      2.85 kB  104 kB
├ ○ /_not-found            873 B    88.1 kB
└ ○ /pricing               194 B    101 kB
```

## File Structure

```
landing-page/
├── app/
│   ├── page.tsx                 # Home page (Hero + Features + Pricing + CTA)
│   ├── pricing/
│   │   └── page.tsx             # Dedicated pricing page
│   ├── layout.tsx               # Root layout (all pages)
│   └── globals.css              # Global styles & animations
│
├── components/                  # Reusable React components
│   ├── Navbar.tsx               # Fixed navigation (responsive mobile menu)
│   ├── Hero.tsx                 # Hero section with CTA buttons
│   ├── Features.tsx             # 6-card feature grid with hover effects
│   ├── Pricing.tsx              # 3-tier pricing table (Free/Pro/Enterprise)
│   ├── CTA.tsx                  # Secondary call-to-action section
│   └── Footer.tsx               # Footer with links, social, contact info
│
├── public/
│   └── robots.txt              # SEO sitemap directive
│
├── Configuration Files
│   ├── next.config.js          # Next.js configuration
│   ├── tailwind.config.ts      # Tailwind CSS theme & colors
│   ├── tsconfig.json           # TypeScript compiler options
│   ├── postcss.config.js       # PostCSS plugins
│   ├── .eslintrc.json          # ESLint rules
│   └── vercel.json             # Vercel deployment config
│
├── Documentation
│   ├── QUICKSTART.md           # Quick start guide
│   ├── README.md               # Detailed documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── SETUP.md                # This file
│
└── package.json                # Dependencies & scripts
```

## Available Commands

```bash
# Development
npm run dev        # Start dev server on http://localhost:3000
                   # Hot reload enabled, TypeScript checking

# Production
npm run build      # Create optimized production build
npm start          # Run production build locally
                   # Only for testing, use Vercel for hosting

# Code Quality
npm run lint       # Run ESLint on all files
                   # Checks for code issues and style

# Utilities
npm fund           # Show funding info for packages
npm audit          # Security audit
npm audit fix      # Auto-fix security issues
```

## Configuration

### Environment Variables

Create `.env.local` in project root:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://voltvoice.app

# API Configuration (optional)
NEXT_PUBLIC_API_URL=https://api.voltvoice.app

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

Notes:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Use for public configuration only
- Never commit `.env.local` to git

### Tailwind CSS Theme

All colors defined in `tailwind.config.ts`:

```typescript
colors: {
  voltvoice: {
    cyan: '#00D9FF',       // Primary accent
    magenta: '#FF006E',    // Secondary accent
    purple: '#7209B7',     // Tertiary accent
    yellow: '#FFD60A',     // Highlight
    dark: '#0A0E27',       // Background
    darker: '#050812',     // Darker background
  }
}
```

Modify these values to match your brand colors.

### Custom Fonts

To add custom fonts (e.g., Google Fonts):

1. Edit `app/layout.tsx`
2. Add font import
3. Apply to body or specific elements

Example:
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

## Page Structure

### Home Page (`app/page.tsx`)

```
Navbar (fixed)
Hero Section
├── Main heading
├── Subheading
├── CTA buttons
└── Trust indicators

Features Section
├── 6 feature cards
├── Icon, title, description
└── Additional stats

Pricing Section
├── 3 pricing tiers
├── Feature lists
└── FAQ section

CTA Section
├── Final call-to-action
├── Trust badges
└── Security indicators

Footer
├── Company info
├── Navigation links
└── Contact information
```

### Pricing Page (`app/pricing/page.tsx`)

Dedicated page showing:
- Pricing table with detailed comparison
- FAQ section
- CTA buttons

## Customization Guide

### Update Hero Text

Edit `components/Hero.tsx`:

```typescript
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
  <span className="block text-white mb-2">Your Heading</span>
  <span className="gradient-text neon-text">Your Subheading</span>
</h1>
```

### Modify Features

Edit `components/Features.tsx`:

Add/remove items in the `features` array:

```typescript
const features = [
  {
    icon: IconComponent,
    title: 'Feature Title',
    description: 'Feature description here',
    gradient: 'from-voltvoice-cyan to-voltvoice-purple',
    shadow: 'shadow-glow-cyan',
  },
  // Add more...
]
```

### Adjust Pricing Plans

Edit `components/Pricing.tsx`:

```typescript
const plans = [
  {
    name: 'Plan Name',
    price: '$9.99',
    period: '/month',
    features: [
      'Feature 1',
      'Feature 2',
      // Add more...
    ],
  },
]
```

### Add Pages

1. Create directory: `app/your-page/`
2. Create file: `app/your-page/page.tsx`
3. Add navigation in `components/Navbar.tsx`

Example page template:
```typescript
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Page Title - VoltVoice',
  description: 'Page description',
}

export default function Page() {
  return (
    <main>
      <Navbar />
      {/* Your content */}
      <Footer />
    </main>
  )
}
```

## Deployment

### Quick Deploy (Recommended)

**Option 1: Vercel (Free, easiest)**

```bash
npm install -g vercel
vercel
```

Follow prompts. Deployment is instant.

**Option 2: GitHub + Vercel**

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects Next.js
5. Click Deploy

### Other Hosting

Works on any Node.js 18+ host:
- Railway
- Render
- Netlify
- AWS Amplify
- DigitalOcean
- Heroku

See `DEPLOYMENT.md` for detailed guides.

### Domain Setup

Once deployed:

1. Buy domain (GoDaddy, Namecheap, etc.)
2. Update DNS records
3. Add domain in hosting dashboard
4. SSL certificate auto-provisioned

## Performance

### Current Metrics

```
Build Size: 104 kB First Load JS
Bundle: Minified & optimized
CSS: ~15 kB (Tailwind purged)
JavaScript: ~87 kB (vendor + app)
```

### Optimization Tips

- Images: Use Next.js Image component
- Code splitting: Automatic with Next.js
- Caching: Configured in vercel.json
- Minification: Automatic in production

## Security

### Built-in Features

- HTTPS enforced (Vercel)
- CSP headers configured
- XSS protection enabled
- CORS properly set
- Environment variables secure

### Best Practices

- Never commit `.env.local`
- Use environment variables for secrets
- Keep dependencies updated
- Review security alerts

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use

```bash
# Use different port
npm run dev -- -p 3001
```

### TypeScript Errors

```bash
# Check tsconfig.json
# Ensure "strict": false or fix type issues
npm run lint
```

### Slow Dev Server

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Support

### Resources

- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev
- TypeScript: https://www.typescriptlang.org/docs

### Tutorials

- Next.js Getting Started: https://nextjs.org/learn
- Tailwind Setup: https://tailwindcss.com/docs/installation
- Vercel Deployment: https://vercel.com/docs

## FAQ

**Q: Can I modify the design?**
A: Yes, edit Tailwind classes and CSS directly.

**Q: How do I add more pages?**
A: Create `app/page-name/page.tsx` and add nav links.

**Q: Can I add a backend?**
A: Yes, create API routes in `app/api/`.

**Q: How do I make it multilingual?**
A: Use `next-intl` package and routing.

**Q: Can I use a database?**
A: Yes, any database works. Add connection in API routes.

**Q: Is it SEO friendly?**
A: Yes, includes meta tags, Open Graph, robots.txt, and more.

## Next Steps

1. ✓ Installation complete
2. Run `npm run dev` to start
3. Customize content in components
4. Update colors in `tailwind.config.ts`
5. Deploy to Vercel
6. Set custom domain
7. Configure analytics

## License

Proprietary - VoltVoice, Inc. All rights reserved.

---

**Last Updated**: March 2026
**Version**: 1.0.0 Production Ready
