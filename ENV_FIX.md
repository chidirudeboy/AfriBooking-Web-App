# Environment Variables Fix for Production

## Issue
After deployment, requests are going to `http://localhost:8080/api` instead of the production API.

## Solution

The app now auto-detects production environment. However, you still need to set environment variables in Vercel.

### Required Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_BASE_URL=https://api.africartz.com/api
```

**OR** (if you want to use auto-detection):

Just set:
```
NEXT_PUBLIC_BASE_URL=https://api.africartz.com/api
```

The app will now auto-detect production if:
- `NODE_ENV=production` (automatically set by Vercel)
- `VERCEL` environment variable exists (automatically set by Vercel)
- `NEXT_PUBLIC_ENV=production` is explicitly set

### Steps to Fix

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - `NEXT_PUBLIC_BASE_URL` = `https://api.africartz.com/api`
   - `NEXT_PUBLIC_ENV` = `production` (optional, auto-detected)
5. **Redeploy** your application

### Verify

After redeploying, check the Network tab in browser DevTools. Requests should go to:
- ✅ `https://api.africartz.com/api/apartment/approved-apartments`
- ❌ NOT `http://localhost:8080/api/apartment/approved-apartments`

### Debug

If still not working, check:
1. Environment variables are set in Vercel
2. You've redeployed after setting variables
3. Check browser console for the actual API URL being used
4. Add this to any page temporarily to debug:
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_BASE_URL);
   console.log('Environment:', process.env.NEXT_PUBLIC_ENV);
   console.log('NODE_ENV:', process.env.NODE_ENV);
   ```

