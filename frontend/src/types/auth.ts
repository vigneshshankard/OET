// User-related types
export interface User {
  id: string
  email: string
  fullName: string
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
  isEmailVerified: boolean
  subscription: Subscription
  stats: UserStats
  createdAt: string
  lastLoginAt: string
}

export interface UserStats {
  sessionsCompleted: number
  averageScore: number
  totalPracticeTime: number
}

export interface Subscription {
  plan: 'free' | 'monthly' | 'annual'
  status: 'active' | 'cancelled' | 'expired'
  sessionsUsed: number
  sessionsLimit: number
  currentPeriodStart?: string
  currentPeriodEnd?: string
  stripeCustomerId?: string
}

// Authentication types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  profession: User['profession']
}