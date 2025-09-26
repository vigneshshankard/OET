/**
 * Authentication Context Provider
 * Manages user authentication state across the application
 */
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiRequest, setAuthToken, clearAuthToken } from '@/lib/api-utils'
import { config } from '@/config/app'

interface User {
  id: string
  email: string
  fullName: string
  profession: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: {
    email: string
    password: string
    fullName: string
    profession: string
  }) => Promise<boolean>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(config.auth.tokenKey)
      const storedUser = localStorage.getItem(config.auth.userKey)
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
      // Clear corrupted data
      clearAuthToken()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiRequest<{
        accessToken: string
        refreshToken: string
        user: User
      }>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, false)
      
      if (data.accessToken && data.user) {
        setToken(data.accessToken)
        setUser(data.user)
        setAuthToken(data.accessToken)
        localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken)
        localStorage.setItem(config.auth.userKey, JSON.stringify(data.user))
        return true
      }
      
      throw new Error('Invalid response from server')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    password: string
    fullName: string
    profession: string
  }): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await apiRequest<{
        accessToken: string
        refreshToken: string
        user: User
      }>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }, false)
      
      if (data.accessToken && data.user) {
        setToken(data.accessToken)
        setUser(data.user)
        setAuthToken(data.accessToken)
        localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken)
        localStorage.setItem(config.auth.userKey, JSON.stringify(data.user))
        return true
      }
      
      throw new Error('Invalid response from server')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      setError(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    clearAuthToken()
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-2xl mb-4">🔄</div>
            <p>Loading...</p>
          </div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-2xl mb-4">🔒</div>
            <p>Please log in to access this page.</p>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}