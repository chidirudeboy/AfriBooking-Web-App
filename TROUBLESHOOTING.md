# Troubleshooting Guide

## API Connection Issues

### Error: `http://localhost:8080/api/apartment/approved-apartments` - Referrer Policy

This error typically indicates one of the following issues:

#### 1. **CORS (Cross-Origin Resource Sharing) Error**

**Symptoms:**
- Error in browser console: "CORS policy" or "Access-Control-Allow-Origin"
- Network request shows status 0 or fails
- Referrer Policy header visible in network tab

**Solution:**
Your backend API server needs to allow requests from your Next.js frontend. Add CORS headers to your backend:

**For Express.js:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URLs
  credentials: true
}));
```

**For other backends:**
- Add `Access-Control-Allow-Origin: http://localhost:3000` header
- Add `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- Add `Access-Control-Allow-Headers: Content-Type, Authorization`

#### 2. **API Server Not Running**

**Symptoms:**
- Network error: "ECONNREFUSED" or "Network Error"
- Cannot reach the server

**Solution:**
1. Ensure your backend API server is running on `http://localhost:8080`
2. Test the API endpoint directly in browser or Postman:
   ```
   http://localhost:8080/api/apartment/approved-apartments
   ```
3. If using a different port, update `.env.local`:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:YOUR_PORT/api
   ```

#### 3. **Wrong API URL Configuration**

**Symptoms:**
- 404 errors
- Wrong endpoint being called

**Solution:**
1. Check your `.env.local` file has the correct base URL:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:8080/api
   ```
2. Restart your Next.js dev server after changing environment variables:
   ```bash
   npm run dev
   ```
3. Verify the environment variable is loaded:
   - Check browser console for the actual URL being called
   - Look for `NEXT_PUBLIC_BASE_URL` in Network tab

#### 4. **Network/Firewall Issues**

**Symptoms:**
- Timeout errors
- Connection refused

**Solution:**
1. Check if port 8080 is accessible
2. Verify firewall settings
3. Try accessing the API directly: `http://localhost:8080/api/apartment/approved-apartments`

## Quick Debugging Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Find the failed request
   - Check:
     - Request URL (is it correct?)
     - Status code (200, 404, 500, etc.)
     - Response headers (CORS headers present?)
     - Response body (error message?)

3. **Test API Directly**
   ```bash
   # Using curl
   curl http://localhost:8080/api/apartment/approved-apartments
   
   # Or open in browser
   http://localhost:8080/api/apartment/approved-apartments
   ```

4. **Verify Environment Variables**
   ```bash
   # Check what URL is being used
   echo $NEXT_PUBLIC_BASE_URL
   
   # Or in browser console
   console.log(process.env.NEXT_PUBLIC_BASE_URL)
   ```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | API server not running | Start backend server |
| `CORS policy` | Backend not allowing origin | Add CORS headers to backend |
| `404 Not Found` | Wrong endpoint URL | Check API URL configuration |
| `Network Error` | Cannot reach server | Check server is running and accessible |
| `401 Unauthorized` | Missing/invalid auth token | Login again or check token |

## Environment Setup

Make sure you have a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_9df897bb5688d8378accd6dcfebaa2a623279c94
```

**Important:** Restart the Next.js dev server after changing environment variables!

## Still Having Issues?

1. Check backend server logs for errors
2. Verify API endpoints match between frontend and backend
3. Ensure backend is configured to accept requests from `http://localhost:3000`
4. Try using the production API URL temporarily to test:
   ```env
   NEXT_PUBLIC_BASE_URL=https://api.africartz.com/api
   ```

