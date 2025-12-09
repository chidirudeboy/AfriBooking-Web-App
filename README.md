# AfriBooking Web App

A Next.js web application for AfriBooking - Find and Book apartments.

## Features

- 🔐 Authentication (Login/Signup/Logout)
- 🏠 Apartment listings with search and filters
- 📱 Responsive design with sidebar navigation
- 🎨 Modern UI with Tailwind CSS
- 💬 Real-time chat/messaging system
- 🔄 Shared utilities with mobile app

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the web-app directory:
```bash
cd web-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `web-app` directory:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_PAYSTACK_KEY=your_paystack_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web-app/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── apartments/        # Apartment listings
│   ├── messages/          # Chat/messaging pages
│   ├── bookings/          # Booking pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── Sidebar.tsx       # Sidebar navigation
│   └── ApartmentCard.tsx # Apartment card component
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Shared utilities
│   ├── config/          # Configuration
│   ├── endpoints.ts     # API endpoints
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
└── public/              # Static assets
```

## Environment Variables

- `NEXT_PUBLIC_BASE_URL` - API base URL
- `NEXT_PUBLIC_ENV` - Environment (development/staging/production)
- `NEXT_PUBLIC_PAYSTACK_KEY` - Paystack public key
- `NEXT_PUBLIC_PAYSTACK_SECRET` - Paystack secret key (optional)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features Implemented

✅ User authentication (login, signup, logout)
✅ Apartment listing page with search
✅ Apartment detail pages
✅ Reservation type filters (Normal Stay, Party, Movie Shoot, Photo Shoot)
✅ Booking functionality
✅ Booking history and details
✅ Responsive sidebar navigation
✅ Protected routes with authentication guards
✅ Notifications system
✅ **Real-time chat/messaging system**
✅ Shared utilities and types with mobile app

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast
- **Icons**: lucide-react

## Deployment

This app is configured for deployment on Vercel. See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variables (see `.env.example`)
4. Deploy!

The app will automatically deploy on every push to the main branch.
