// Environment configuration
export const config = {
  app: {
    name: 'OET Praxis',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description: 'AI-powered speaking practice for healthcare professionals',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001',
  },
  auth: {
    tokenKey: 'authToken',
    refreshTokenKey: 'refreshToken', 
    userKey: 'user',
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  features: {
    freeSessions: 3,
    maxAudioDuration: 900, // 15 minutes in seconds
  },
}