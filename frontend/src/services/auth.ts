import { apiClient, LoginRequest, LoginResponse, RegisterRequest } from '@/lib/api-client'

export interface User {
  id: string
  email: string
  fullName: string
  profession: string
  role: string
  subscriptionTier: string
  isActive: boolean
  createdAt: string
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Basic validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Invalid email format')
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const response = await apiClient.login({ email, password })
    return response
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Validation
    if (!data.email) throw new Error('Email is required')
    if (!data.fullName) throw new Error('Full name is required')
    if (!data.profession) throw new Error('Profession is required')
    
    const validProfessions = ['doctor', 'nurse', 'dentist', 'physiotherapist']
    if (!validProfessions.includes(data.profession)) {
      throw new Error('Invalid profession')
    }

    const response = await apiClient.register(data)
    return response
  }

  async getCurrentUser(): Promise<{ user: User } | null> {
    const token = localStorage.getItem('accessToken')
    if (!token) return null

    // For now, return a mock user since we don't have a me endpoint
    return {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        profession: 'doctor',
        role: 'user',
        subscriptionTier: 'free',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      }
    }
  }

  async logout(): Promise<{ message: string }> {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      return { message: 'Already logged out' }
    }

    await apiClient.logout()
    
    return { message: 'Logged out successfully' }
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    // For now, return mock tokens since we don't have a refresh endpoint
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    }
    
    // Update tokens
    localStorage.setItem('accessToken', newTokens.accessToken)
    localStorage.setItem('refreshToken', newTokens.refreshToken)

    return newTokens
  }
}

export const authService = new AuthService()