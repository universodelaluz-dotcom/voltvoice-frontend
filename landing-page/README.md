# VoltVoice Landing Page

Professional Next.js landing page for VoltVoice - AI voice cloning platform for TikTok streamers.

## Features

- **Modern Design**: Neon aesthetic with gradient effects
- **Responsive**: Mobile-first, works on all devices
- **Dark Theme**: Professional dark purple background
- **Animations**: Smooth transitions and hover effects
- **SEO Optimized**: Meta tags, Open Graph, XML sitemap
- **Performance**: Optimized images, fast load times
- **Accessibility**: WCAG compliant

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Project Structure

```
landing-page/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── pricing/
│   │   └── page.tsx         # Pricing page
│   └── globals.css          # Global styles
├── components/
│   ├── Navbar.tsx           # Navigation bar
│   ├── Hero.tsx             # Hero section
│   ├── Features.tsx         # Features grid
│   ├── Pricing.tsx          # Pricing table
│   ├── CTA.tsx              # Call-to-action
│   └── Footer.tsx           # Footer
├── public/                  # Static assets
├── vercel.json             # Vercel configuration
└── tailwind.config.ts      # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd landing-page
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SITE_URL=https://voltvoice.app
NEXT_PUBLIC_API_URL=https://api.voltvoice.app
```

### Color Scheme

The brand colors are configured in `tailwind.config.ts`:

- **Cyan**: #00D9FF
- **Magenta**: #FF006E
- **Purple**: #7209B7
- **Yellow**: #FFD60A
- **Dark BG**: #0A0E27

## Customization

### Brand Content

Edit text content in component files:
- Hero section: `components/Hero.tsx`
- Features: `components/Features.tsx`
- Pricing: `components/Pricing.tsx`

### Styling

All styles use Tailwind CSS. Modify `tailwind.config.ts` for theme changes.

### Adding Pages

Create new pages in `app/[page]/page.tsx` and add them to the navbar in `components/Navbar.tsx`.

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

The `vercel.json` is pre-configured for optimal deployment.

### Deploy to Other Platforms

The project works on any platform supporting Node.js:
- Netlify
- Railway
- Render
- AWS Amplify

## Performance Optimization

- Images optimized with Next.js Image component
- Code splitting automatic with Next.js
- CSS purging with Tailwind
- Minification enabled in production

## SEO

- Metadata configured in `app/layout.tsx`
- Open Graph tags for social sharing
- Mobile-friendly design
- Fast Core Web Vitals

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - VoltVoice, Inc.

## Support

For issues or questions, contact support@voltvoice.com
