'use client'

import { ErrorBoundary, ErrorProvider } from '@/components/error-boundary'
import { AuthProvider } from '@/contexts/auth-context'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

interface ClientErrorBoundaryProps {
  children: React.ReactNode
}

export function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    // Log critical application errors
    console.error('🚨 Critical Application Error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })
    
    // Report to error tracking service
    if (typeof window !== 'undefined') {
      // Send to analytics/monitoring service
      (window as any).gtag?.('event', 'exception', {
        description: error.message,
        fatal: true
      })
    }
  }

  return (
    <ErrorProvider>
      <ErrorBoundary 
        context="Application Root"
        onError={handleError}
        maxRetries={1}
      >
        <AuthProvider>
          <ErrorBoundary context="Layout Header">
            <Header />
          </ErrorBoundary>
          <main className="flex-1">
            <ErrorBoundary context="Main Content">
              {children}
            </ErrorBoundary>
          </main>
          <ErrorBoundary context="Layout Footer">
            <Footer />
          </ErrorBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </ErrorProvider>
  )
}