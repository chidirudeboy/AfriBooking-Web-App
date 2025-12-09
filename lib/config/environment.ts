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
const currentEnv = (process.env.NEXT_PUBLIC_ENV as 'development' | 'staging' | 'production') || 'development';

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

