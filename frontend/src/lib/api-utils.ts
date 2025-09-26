/**
 * API utilities for consistent API calls across the frontend
 */

import { config } from '@/config/app'

export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(config.auth.tokenKey)
}

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(config.auth.tokenKey, token)
}

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(config.auth.tokenKey)
  localStorage.removeItem(config.auth.refreshTokenKey)
  localStorage.removeItem(config.auth.userKey)
}

export const createAuthHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  return headers
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true
): Promise<T> => {
  const url = getApiUrl(endpoint)
  const headers = createAuthHeaders(includeAuth)

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorJson.message || errorMessage
    } catch {
      // If not JSON, use the text as is
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }

  return response.json()
}