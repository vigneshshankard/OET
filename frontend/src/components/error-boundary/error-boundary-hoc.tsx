'use client'

import React, { ComponentType, ReactNode } from 'react'
import ErrorBoundary from './error-boundary'
import { 
  AuthErrorBoundary, 
  APIErrorBoundary, 
  PracticeErrorBoundary, 
  AdminErrorBoundary,
  RealtimeErrorBoundary 
} from './specialized-boundaries'

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    context?: string
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
    maxRetries?: number
    resetKeys?: Array<string | number>
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        context={options.context || Component.displayName || Component.name}
        fallback={options.fallback}
        onError={options.onError}
        maxRetries={options.maxRetries}
        resetKeys={options.resetKeys}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Higher-order component for auth-protected components
export function withAuthErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    onAuthError?: () => void
    fallbackAction?: () => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AuthErrorBoundary
        onAuthError={options.onAuthError}
        fallbackAction={options.fallbackAction}
      >
        <Component {...props} />
      </AuthErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Higher-order component for API-dependent components
export function withAPIErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    endpoint?: string
    onAPIError?: (error: Error) => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <APIErrorBoundary
        endpoint={options.endpoint}
        onAPIError={options.onAPIError}
      >
        <Component {...props} />
      </APIErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withAPIErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Higher-order component for practice session components
export function withPracticeErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    sessionId?: string
    onPracticeError?: (error: Error) => void
    onReturnToDashboard?: () => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <PracticeErrorBoundary
        sessionId={options.sessionId}
        onPracticeError={options.onPracticeError}
        onReturnToDashboard={options.onReturnToDashboard}
      >
        <Component {...props} />
      </PracticeErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withPracticeErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Higher-order component for admin components
export function withAdminErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    section?: string
    onAdminError?: (error: Error) => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <AdminErrorBoundary
        section={options.section}
        onAdminError={options.onAdminError}
      >
        <Component {...props} />
      </AdminErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withAdminErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Higher-order component for realtime components
export function withRealtimeErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    connectionType?: 'webrtc' | 'websocket' | 'livekit'
    onConnectionError?: (error: Error) => void
    onFallbackMode?: () => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <RealtimeErrorBoundary
        connectionType={options.connectionType}
        onConnectionError={options.onConnectionError}
        onFallbackMode={options.onFallbackMode}
      >
        <Component {...props} />
      </RealtimeErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withRealtimeErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Error boundary hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const reportError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { reportError, clearError }
}

// Error boundary provider for context-based error handling
interface ErrorContextType {
  reportError: (error: Error, context?: string) => void
  clearError: () => void
  errors: Array<{ error: Error; context?: string; timestamp: number }>
}

const ErrorContext = React.createContext<ErrorContextType | null>(null)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = React.useState<Array<{ error: Error; context?: string; timestamp: number }>>([])

  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorEntry = { error, context, timestamp: Date.now() }
    setErrors(prev => [...prev, errorEntry])
    
    // Auto-clear errors after 5 minutes
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.timestamp !== errorEntry.timestamp))
    }, 5 * 60 * 1000)
  }, [])

  const clearError = React.useCallback(() => {
    setErrors([])
  }, [])

  return (
    <ErrorContext.Provider value={{ reportError, clearError, errors }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useErrorContext() {
  const context = React.useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  return context
}

export default {
  withErrorBoundary,
  withAuthErrorBoundary,
  withAPIErrorBoundary,
  withPracticeErrorBoundary,
  withAdminErrorBoundary,
  withRealtimeErrorBoundary,
  useErrorHandler,
  ErrorProvider,
  useErrorContext
}