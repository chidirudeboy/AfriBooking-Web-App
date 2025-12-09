export interface EnvironmentConfig {
  env: 'development' | 'staging' | 'production';
  baseUrl: string;
  paystackKey: string;
  paystackSecret?: string;
  apiTimeout: number;
  appName: string;
  debugMode: boolean;
}

// Simple environment configuration using process.env directly
// Auto-detect production if NODE_ENV is production or if we're on Vercel
const detectEnvironment = (): 'development' | 'staging' | 'production' => {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_ENV) {
    return process.env.NEXT_PUBLIC_ENV as 'development' | 'staging' | 'production';
  }
  
  // Auto-detect production on Vercel or when NODE_ENV is production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'production';
  }
  
  // Default to development for local development
  return 'development';
};

const currentEnv = detectEnvironment();

// Set different default URLs based on environment
const getDefaultBaseUrl = () => {
  switch (currentEnv) {
    case 'development':
      return 'http://localhost:8080/api';
    case 'staging':
      return 'https://staging-api.africartz.com/api';
    case 'production':
    default:
      return 'https://api.africartz.com/api';
  }
};

export const config: EnvironmentConfig = {
  env: currentEnv,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || getDefaultBaseUrl(),
  paystackKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY || (currentEnv === 'production' ? 'pk_live_21c1bcc0b03668eddc2502a9b5ded80c5dae5587' : 'pk_test_9df897bb5688d8378accd6dcfebaa2a623279c94'),
  paystackSecret: process.env.NEXT_PUBLIC_PAYSTACK_SECRET,
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '15000'),
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'AfriBooking',
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};

// Debug logging (only in development or when debug mode is enabled)
if (typeof window !== 'undefined' && (currentEnv === 'development' || config.debugMode)) {
  console.log('🔧 Environment Config:', {
    env: currentEnv,
    baseUrl: config.baseUrl,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
  });
}

// Export individual config values for easier access
export const {
  env,
  baseUrl,
  paystackKey,
  paystackSecret,
  apiTimeout,
  appName,
  debugMode,
} = config;

// Development helpers
export const isDev = env === 'development';
export const isStaging = env === 'staging';
export const isProd = env === 'production';

export default config;

