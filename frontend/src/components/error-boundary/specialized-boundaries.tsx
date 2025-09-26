'use client'

import React, { ReactNode } from 'react'
import ErrorBoundary from './error-boundary'
import { AlertCircle, Shield, Wifi, User, Settings, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import ErrorReportingService from '@/services/error-reporting'

// Auth Error Boundary - for authentication-related components
interface AuthErrorBoundaryProps {
  children: ReactNode
  onAuthError?: () => void
  fallbackAction?: () => void
}

export const AuthErrorBoundary: React.FC<AuthErrorBoundaryProps> = ({ 
  children, 
  onAuthError,
  fallbackAction 
}) => {
  const handleAuthError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    console.error('Authentication Error:', error)
    
    // Report auth error
    ErrorReportingService.reportAuthError(error, 'Component Error', {
      errorId,
      componentStack: errorInfo.componentStack
    })
    
    onAuthError?.()
    
    // Specific handling for auth errors
    if (error.message.includes('unauthorized') || error.message.includes('403')) {
      // Clear auth tokens and redirect
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/auth/login'
    }
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardDescription>
            Authentication Error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            There was a problem with authentication. Please try logging in again.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.href = '/auth/login'}
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              Login Again
            </Button>
            {fallbackAction && (
              <Button 
                onClick={fallbackAction}
                variant="outline"
                className="w-full"
              >
                Continue as Guest
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context="Authentication"
      onError={handleAuthError}
      fallback={fallback}
      maxRetries={1}
    >
      {children}
    </ErrorBoundary>
  )
}

// API Error Boundary - for API-dependent components
interface APIErrorBoundaryProps {
  children: ReactNode
  endpoint?: string
  onAPIError?: (error: Error) => void
}

export const APIErrorBoundary: React.FC<APIErrorBoundaryProps> = ({ 
  children, 
  endpoint,
  onAPIError 
}) => {
  const handleAPIError = (error: Error) => {
    console.error('API Error:', error)
    onAPIError?.(error)
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Wifi className="w-6 h-6 text-orange-600" />
          </div>
          <CardDescription>
            Connection Error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unable to connect to the server{endpoint ? ` (${endpoint})` : ''}. 
            Please check your connection and try again.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context={`API${endpoint ? ` (${endpoint})` : ''}`}
      onError={handleAPIError}
      fallback={fallback}
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  )
}

// Practice Session Error Boundary - for practice/learning components
interface PracticeErrorBoundaryProps {
  children: ReactNode
  sessionId?: string
  onPracticeError?: (error: Error) => void
  onReturnToDashboard?: () => void
}

export const PracticeErrorBoundary: React.FC<PracticeErrorBoundaryProps> = ({ 
  children, 
  sessionId,
  onPracticeError,
  onReturnToDashboard 
}) => {
  const handlePracticeError = (error: Error) => {
    console.error('Practice Session Error:', error)
    onPracticeError?.(error)
    
    // Save error context for session recovery
    if (sessionId) {
      localStorage.setItem(`practice_error_${sessionId}`, JSON.stringify({
        error: error.message,
        timestamp: Date.now()
      }))
    }
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <CardDescription>
            Practice Session Error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            There was an issue with your practice session
            {sessionId ? ` (${sessionId})` : ''}. 
            Your progress has been saved automatically.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Restart Session
            </Button>
            <Button 
              onClick={onReturnToDashboard || (() => window.location.href = '/dashboard')}
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context={`Practice Session${sessionId ? ` (${sessionId})` : ''}`}
      onError={handlePracticeError}
      fallback={fallback}
      maxRetries={2}
      resetKeys={sessionId ? [sessionId] : undefined}
    >
      {children}
    </ErrorBoundary>
  )
}

// Admin Error Boundary - for admin dashboard components
interface AdminErrorBoundaryProps {
  children: ReactNode
  section?: string
  onAdminError?: (error: Error) => void
}

export const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({ 
  children, 
  section,
  onAdminError 
}) => {
  const handleAdminError = (error: Error) => {
    console.error('Admin Panel Error:', error)
    onAdminError?.(error)
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <CardDescription>
            Admin Panel Error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            There was an issue loading the {section || 'admin'} section. 
            The error has been logged for review.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Section
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              variant="outline"
              className="w-full"
            >
              Back to Admin Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context={`Admin Panel${section ? ` - ${section}` : ''}`}
      onError={handleAdminError}
      fallback={fallback}
      maxRetries={1}
    >
      {children}
    </ErrorBoundary>
  )
}

// Realtime Error Boundary - for real-time features (WebRTC, WebSocket, etc.)
interface RealtimeErrorBoundaryProps {
  children: ReactNode
  connectionType?: 'webrtc' | 'websocket' | 'livekit'
  onConnectionError?: (error: Error) => void
  onFallbackMode?: () => void
}

export const RealtimeErrorBoundary: React.FC<RealtimeErrorBoundaryProps> = ({ 
  children, 
  connectionType = 'webrtc',
  onConnectionError,
  onFallbackMode 
}) => {
  const handleConnectionError = (error: Error) => {
    console.error('Realtime Connection Error:', error)
    onConnectionError?.(error)
  }

  const fallback = (
    <div className="flex items-center justify-center min-h-[300px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardDescription>
            Connection Issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Unable to establish {connectionType.toUpperCase()} connection. 
            This may be due to network restrictions or browser compatibility.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Retry Connection
            </Button>
            {onFallbackMode && (
              <Button 
                onClick={onFallbackMode}
                variant="outline"
                className="w-full"
              >
                Use Fallback Mode
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context={`Realtime Connection (${connectionType})`}
      onError={handleConnectionError}
      fallback={fallback}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  )
}

export default {
  AuthErrorBoundary,
  APIErrorBoundary,
  PracticeErrorBoundary,
  AdminErrorBoundary,
  RealtimeErrorBoundary
}