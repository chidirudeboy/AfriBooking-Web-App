# Quick Setup Guide

## Installation Steps

1. **Navigate to the web-app directory:**
   ```bash
   cd web-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env.local` file in the `web-app` directory with:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:8080/api
   NEXT_PUBLIC_ENV=development
   NEXT_PUBLIC_PAYSTACK_KEY=your_paystack_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features Implemented

✅ **Authentication System**
- Login page with email/password
- Signup page with validation
- Logout functionality
- Protected routes

✅ **Apartment Listings**
- View all approved apartments
- Search functionality
- Filter by reservation type (Normal Stay, Party, Movie Shoot, Photo Shoot)
- Responsive apartment cards with images

✅ **Navigation**
- Sidebar navigation with menu items
- Mobile-responsive hamburger menu
- User profile display in sidebar
- Active route highlighting

✅ **Shared Code**
- Reusable API utilities
- Shared TypeScript types
- Common utility functions
- Environment configuration

## Project Structure

```
web-app/
├── app/                    # Next.js pages
│   ├── login/             # Login page
│   ├── signup/           # Signup page
│   ├── apartments/        # Apartment listings
│   └── layout.tsx         # Root layout with AuthProvider
├── components/           # React components
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── ApartmentCard.tsx # Apartment display card
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state management
└── lib/                 # Shared utilities
    ├── config/         # Environment config
    ├── endpoints.ts    # API endpoints
    ├── types/          # TypeScript types
    └── utils/          # Helper functions
```

## API Integration

The app uses the same API endpoints as the mobile app:
- Authentication: `/auth/login`, `/auth/createAccount`
- Apartments: `/apartment/approved-apartments`
- User Profile: `/auth/user-profile`

## Next Steps

To extend the app, consider adding:
- Apartment detail page
- Booking functionality
- Payment integration
- User profile page
- Notifications
- Chat/Messages

## Troubleshooting

**Issue: Cannot connect to API**
- Check your `.env.local` file has the correct `NEXT_PUBLIC_BASE_URL`
- Ensure your backend server is running
- Check CORS settings on your backend

**Issue: Authentication not working**
- Clear browser localStorage
- Check that tokens are being saved correctly
- Verify API endpoints are correct

**Issue: Images not loading**
- Check image URLs in apartment data
- Verify Next.js image domain configuration in `next.config.js`

