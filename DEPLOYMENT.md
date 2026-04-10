# VoltVoice Landing Page - Deployment Guide

Complete guide to deploy your VoltVoice landing page to production.

## Quick Deploy to Vercel

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from landing-page directory
cd landing-page
vercel
```

Follow the prompts to connect your GitHub account and configure deployment.

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository
4. Configure environment variables
5. Click Deploy

### Environment Variables on Vercel

1. Go to Project Settings
2. Navigate to Environment Variables
3. Add:
   - `NEXT_PUBLIC_SITE_URL`: Your domain
   - `NEXT_PUBLIC_API_URL`: Your API endpoint

## Domain Configuration

### Connect Custom Domain

1. In Vercel Project Settings → Domains
2. Add your domain
3. Add DNS records:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel.com

### SSL Certificate

Vercel automatically provisions SSL certificates at no cost.

## Performance Optimization

### Build Optimization

The `next.config.js` is pre-configured with:
- SWC minification (faster builds)
- Image optimization
- Static generation

### Caching

Vercel automatically caches:
- Static assets (1 year)
- HTML pages (60 seconds)
- API responses (configurable)

## Monitoring & Analytics

### Vercel Analytics

1. Project Settings → Analytics
2. Enable Web Vitals
3. Monitor performance metrics

### Suggested Third-party Tools

- **Google Analytics**: SEO tracking
- **Sentry**: Error monitoring
- **LogRocket**: Session replay

## CI/CD Pipeline

Vercel automatically:
- Builds on every push to main
- Runs previews for pull requests
- Deploys on merge
- Rolls back on failures

## Backup & Version Control

```bash
# Push to GitHub
git add .
git commit -m "Deploy VoltVoice landing page"
git push origin main

# Vercel will automatically deploy
```

## Security Headers

Vercel automatically adds:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### Add Custom Headers

Edit `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    }
  ]
}
```

## Redirects & Rewrites

Configure in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/old-url",
      "destination": "/new-url",
      "permanent": true
    }
  ]
}
```

## Database Integration (Optional)

For backend features:

### PostgreSQL
```bash
# Using Vercel Postgres
npm install @vercel/postgres
```

### Environment Setup
```env
POSTGRES_URLPGSQL_URL=postgres://...
```

## Email Integration (Optional)

### Resend (Recommended)
```bash
npm install resend
```

Configure in Vercel:
```env
NEXT_PUBLIC_RESEND_API_KEY=your_key
```

## Cost Estimation

### Vercel Free Tier Includes
- Unlimited static sites
- 100GB bandwidth/month
- Automatic deployments
- SSL certificates
- CDN

### Pro Plan
- $20/month
- Team collaboration
- Priority support
- Enhanced limits

## Troubleshooting

### Build Fails

1. Check build logs: `vercel logs`
2. Ensure Node version 18+ is set
3. Verify all dependencies are installed

### Slow Performance

1. Enable Image Optimization
2. Reduce bundle size
3. Use CDN for assets

### Domain Not Resolving

1. Verify DNS records are updated
2. Wait for DNS propagation (up to 48 hours)
3. Clear browser cache

## Post-Deployment

### Monitor

- Set up Google Analytics
- Enable Vercel Analytics
- Monitor error rates

### Update Content

Edit components and redeploy:
```bash
git commit -am "Update content"
git push origin main
# Vercel deploys automatically
```

### Scale as Needed

- Monitor bandwidth usage
- Upgrade plan if needed
- Consider caching strategies

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- VoltVoice Support: support@voltvoice.com
