# Vercel Deployment Guide

This guide will help you deploy the AfriBooking Web App to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub repository connected (already done: https://github.com/chidirudeboy/AfriBooking-Web-App.git)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Import Project"
   - Select the `chidirudeboy/AfriBooking-Web-App` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add the following:

   ```
   NEXT_PUBLIC_BASE_URL=https://api.africartz.com/api
   NEXT_PUBLIC_PAYSTACK_KEY=pk_live_21c1bcc0b03668eddc2502a9b5ded80c5dae5587
   NEXT_PUBLIC_API_TIMEOUT=15000
   NEXT_PUBLIC_APP_NAME=AfriBooking
   NEXT_PUBLIC_DEBUG_MODE=false
   ```

   **Important Notes:**
   - `NEXT_PUBLIC_ENV=production` is **optional** - the app will auto-detect production on Vercel
   - `NEXT_PUBLIC_BASE_URL` is **required** - this is the production API URL
   - For production, use your live Paystack key. For testing, you can use the test key.
   - **Make sure to select "Production" environment** when adding variables (or "All" to apply to all environments)

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Confirm settings
   - Deploy to production: `vercel --prod`

## Environment Variables for Production

Make sure to set these in your Vercel project settings:

| Variable | Production Value | Description |
|----------|------------------|-------------|
| `NEXT_PUBLIC_ENV` | `production` | Environment mode |
| `NEXT_PUBLIC_BASE_URL` | `https://api.africartz.com/api` | API base URL |
| `NEXT_PUBLIC_PAYSTACK_KEY` | `pk_live_...` | Paystack live public key |
| `NEXT_PUBLIC_API_TIMEOUT` | `15000` | API timeout in ms |
| `NEXT_PUBLIC_APP_NAME` | `AfriBooking` | Application name |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` | Debug mode flag |

## Post-Deployment

1. **Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Verify Deployment**
   - Check that all pages load correctly
   - Test authentication flow
   - Test apartment listings
   - Test chat/messaging functionality

3. **Monitor**
   - Check Vercel Analytics (if enabled)
   - Monitor error logs in Vercel Dashboard
   - Set up error tracking if needed

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build scripts

### API Errors
- Verify `NEXT_PUBLIC_BASE_URL` is correct
- Check CORS settings on your API server
- Ensure API is accessible from Vercel's servers

### Image Loading Issues
- Check `next.config.js` for image domain configuration
- Ensure remote image domains are allowed

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds automatically

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

