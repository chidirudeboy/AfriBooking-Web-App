# Session Management Documentation

## Overview

The app now implements comprehensive session management with automatic logout, token expiration checking, and inactivity timeout.

## Features Implemented

### 1. **Token Expiration Checking**
- Automatically decodes JWT tokens to check expiration
- Validates token `exp` claim on app load and at regular intervals
- Logs out user if token is expired

### 2. **Inactivity Timeout**
- Tracks user activity (mouse, keyboard, touch, scroll events)
- Automatically logs out after **30 minutes** of inactivity
- Shows warning **5 minutes** before timeout

### 3. **Session Warning**
- Displays a warning banner when session is about to expire
- User can click "Stay Logged In" to extend the session
- User can click "Logout" to manually log out

### 4. **Automatic Logout**
- Logs out on 401 Unauthorized responses from API
- Logs out on token expiration
- Logs out on inactivity timeout
- Clears localStorage and redirects to login page

## Configuration

Session timeout settings are defined in `contexts/AuthContext.tsx`:

```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const TOKEN_CHECK_INTERVAL = 60 * 1000; // Check every minute
```

### To Change Timeout Duration

Edit the constants in `contexts/AuthContext.tsx`:

```typescript
// For 1 hour timeout:
const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes

// For 15 minute warning:
const SESSION_WARNING_TIME = 15 * 60 * 1000; // 15 minutes before timeout
```

## How It Works

### Activity Tracking
- Tracks: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`
- Updates `lastActivity` timestamp on any user interaction
- Resets warning when user becomes active again

### Token Validation
- Decodes JWT token to extract `exp` claim
- Compares expiration time with current time
- Checks every minute (configurable via `TOKEN_CHECK_INTERVAL`)

### Session Expiration Flow
1. User becomes inactive for 25 minutes
2. Warning appears: "Session will expire in 5 minutes"
3. User can click "Stay Logged In" to extend
4. If no action, session expires after 30 minutes total
5. User is logged out and redirected to login

## Components

### SessionWarning Component
Located at `components/SessionWarning.tsx`

- Displays warning banner at bottom-right of screen
- Shows countdown message
- Provides "Stay Logged In" and "Logout" buttons
- Automatically hides when user becomes active

### AuthContext Updates
- Added `showSessionWarning` state
- Added `extendSession()` function
- Added `lastActivity` tracking
- Added token expiration checking

## API Integration

### Automatic 401 Handling
The API interceptor in `lib/utils/api.ts` automatically:
- Detects 401 Unauthorized responses
- Clears user session
- Redirects to login page

## User Experience

### Normal Flow
1. User logs in → Session starts
2. User is active → Session continues
3. User inactive for 25 min → Warning appears
4. User clicks "Stay Logged In" → Session extended
5. User continues working

### Expiration Flow
1. User logs in → Session starts
2. User inactive for 25 min → Warning appears
3. User ignores warning → Session expires after 30 min
4. User is logged out → Redirected to login

### Token Expiration Flow
1. User has valid token → Session active
2. Token expires (based on JWT `exp` claim) → Detected on next check
3. User is logged out → Redirected to login with message

## Testing

### Test Inactivity Timeout
1. Login to the app
2. Wait 25 minutes without interaction
3. Warning should appear
4. Wait 5 more minutes without clicking "Stay Logged In"
5. Should be logged out automatically

### Test Token Expiration
1. Login to the app
2. Manually expire token in localStorage (if backend supports)
3. Wait for next token check (1 minute)
4. Should be logged out automatically

### Test Session Extension
1. Login to the app
2. Wait for warning to appear
3. Click "Stay Logged In"
4. Warning should disappear
5. Session should continue

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Token Validation**: JWT tokens are validated client-side (backend should also validate)
3. **Activity Tracking**: Only tracks user interaction, not sensitive data
4. **Automatic Logout**: Prevents unauthorized access if user leaves device unattended

## Future Enhancements

Potential improvements:
- [ ] Token refresh using refreshToken
- [ ] Remember me option (longer timeout)
- [ ] Server-side session validation
- [ ] Activity-based session extension (auto-extend on API calls)
- [ ] Configurable timeout per user role

## Troubleshooting

### Session expires too quickly
- Check `SESSION_TIMEOUT` value
- Verify activity tracking is working (check browser console)

### Warning doesn't appear
- Check `SESSION_WARNING_TIME` value
- Verify `showSessionWarning` state in AuthContext
- Check browser console for errors

### Token always expired
- Verify token format (should be JWT with `exp` claim)
- Check token decoding logic
- Verify backend token expiration time

