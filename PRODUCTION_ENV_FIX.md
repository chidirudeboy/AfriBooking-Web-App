# Production Environment Variables Fix

## Problem
After deployment to Vercel, API requests were going to `http://localhost:8080/api` instead of the production API URL.

## Solution Applied

### 1. Auto-Detection of Production Environment
The app now automatically detects when it's running in production by checking:
- `NODE_ENV === 'production'` (automatically set by Vercel)
- `VERCEL` environment variable (automatically set by Vercel)
- Or explicitly set `NEXT_PUBLIC_ENV=production`

### 2. Updated Environment Configuration
- Production environment is now auto-detected
- Falls back to production API URL (`https://api.africartz.com/api`) when in production
- Still respects `NEXT_PUBLIC_BASE_URL` if explicitly set

## Action Required in Vercel

You **MUST** set the environment variable in Vercel:

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **AfriBooking-Web-App**
3. Go to **Settings** → **Environment Variables**
4. Add/Update this variable:
   - **Key**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://api.africartz.com/api`
   - **Environment**: Select **Production** (or **All** to apply to all environments)
5. Click **Save**
6. **Redeploy** your application (go to Deployments → click the three dots → Redeploy)

### Required Environment Variables

| Variable | Production Value | Required |
|----------|------------------|----------|
| `NEXT_PUBLIC_BASE_URL` | `https://api.africartz.com/api` | ✅ **YES** |
| `NEXT_PUBLIC_ENV` | `production` | ❌ Optional (auto-detected) |
| `NEXT_PUBLIC_PAYSTACK_KEY` | `pk_live_...` | ✅ Recommended |
| `NEXT_PUBLIC_API_TIMEOUT` | `15000` | ❌ Optional |
| `NEXT_PUBLIC_APP_NAME` | `AfriBooking` | ❌ Optional |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` | ❌ Optional |

## How to Verify

After redeploying:

1. Open your deployed app in browser
2. Open DevTools (F12) → Network tab
3. Navigate to apartments page
4. Check the request URL - it should be:
   - ✅ `https://api.africartz.com/api/apartment/approved-apartments`
   - ❌ NOT `http://localhost:8080/api/apartment/approved-apartments`

5. Check browser console for debug info (in development mode):
   ```
   🔧 Environment Config: {
     env: "production",
     baseUrl: "https://api.africartz.com/api",
     ...
   }
   ```

## Important Notes

- **Environment variables must be set BEFORE building** - Next.js bakes them into the build
- **You must redeploy** after adding/changing environment variables
- Variables prefixed with `NEXT_PUBLIC_` are available in the browser
- Make sure to select the correct environment (Production/Preview/Development) when adding variables

## Troubleshooting

### Still seeing localhost URLs?

1. **Check Vercel Environment Variables:**
   - Go to Settings → Environment Variables
   - Verify `NEXT_PUBLIC_BASE_URL` is set correctly
   - Make sure it's set for **Production** environment

2. **Redeploy:**
   - After changing environment variables, you MUST redeploy
   - Go to Deployments → Click "..." → Redeploy

3. **Check Build Logs:**
   - In Vercel, go to your deployment
   - Check the build logs to see if environment variables are being read

4. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache

5. **Check Network Tab:**
   - Open DevTools → Network tab
   - Look at the actual request URL being made
   - This will show you what the app is using

## Code Changes Made

- Updated `lib/config/environment.ts` to auto-detect production environment
- Added debug logging for environment configuration
- Updated Vercel deployment documentation

