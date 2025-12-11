# Clearing Next.js Build Cache

## Why This Error Happens

The `Cannot find module './901.js'` (or similar chunk errors) occurs when Next.js's build cache gets corrupted. This commonly happens during development when:

1. **Hot Module Replacement (HMR)** - Fast code changes can cause webpack chunks to get out of sync
2. **Dev Server Restarts** - Interrupted restarts can leave partial cache files
3. **Rapid File Changes** - Making many changes quickly can confuse the bundler
4. **Node Modules Updates** - Installing/updating packages can invalidate cache

## Quick Fix

Run these commands when you see the error:

```bash
# Stop the dev server (Ctrl+C)
pkill -f "next dev"

# Clear the cache
rm -rf .next

# Restart
npm run dev
```

## Prevention Tips

1. **Wait for compilation** - Let one compilation finish before making more changes
2. **Restart cleanly** - Use Ctrl+C to stop the server instead of force-killing
3. **Clear cache regularly** - If you notice slowdowns, clear the cache proactively
4. **Check for errors** - Fix TypeScript/ESLint errors as they can cause cache issues

## Automated Script

You can add this to your `package.json`:

```json
"scripts": {
  "dev:clean": "rm -rf .next && npm run dev",
  "clear-cache": "rm -rf .next"
}
```

Then use `npm run dev:clean` to start with a fresh cache.

