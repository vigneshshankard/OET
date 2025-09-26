'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ErrorReportingService from '@/services/error-reporting'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  showErrorDetails?: boolean
  maxRetries?: number
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  isolate?: boolean
  context?: string
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onReset: () => void
  onReportError: () => void
  showErrorDetails: boolean
  context?: string
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
  onReportError,
  showErrorDetails,
  context
}) => {
  const canRetry = retryCount < maxRetries
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">
            Something went wrong
          </CardTitle>
          <CardDescription>
            {context 
              ? `An error occurred in the ${context} component.`
              : 'An unexpected error has occurred.'
            } We apologize for the inconvenience.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error ID for support */}
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              <strong>Error ID:</strong> {errorId}
              <br />
              <span className="text-sm text-muted-foreground">
                Please reference this ID when contacting support.
              </span>
            </AlertDescription>
          </Alert>

          {/* Error details for development */}
          {showErrorDetails && !isProduction && error && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Error Details (Development Only):</h4>
              <div className="text-xs font-mono bg-red-50 p-2 rounded border">
                <div className="text-red-700 font-semibold">{error.name}: {error.message}</div>
                {error.stack && (
                  <pre className="mt-2 text-red-600 whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                )}
              </div>
              {errorInfo && errorInfo.componentStack && (
                <div className="mt-2">
                  <div className="text-sm font-semibold">Component Stack:</div>
                  <pre className="text-xs bg-yellow-50 p-2 rounded border mt-1 whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {canRetry && (
              <Button 
                onClick={onRetry}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </Button>
            )}
            
            <Button 
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Reset Component
            </Button>

            <Button 
              onClick={onReportError}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Bug className="w-4 w-4" />
              Report Issue
            </Button>
          </div>

          {!canRetry && (
            <div className="text-sm text-muted-foreground text-center pt-2">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // Report error to tracking service
    ErrorReportingService.reportComponentError(
      error,
      errorInfo,
      this.props.context,
      {
        props: this.props.isolate ? null : this.props,
        resetOnPropsChange: this.props.resetOnPropsChange,
        maxRetries: this.props.maxRetries
      }
    )

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId)
    }

    // Log error for monitoring
    this.logError(error, errorInfo, errorId)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    // Reset error boundary if props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && this.hasPropsChanged(prevProps)) {
      this.resetErrorBoundary()
    }

    // Reset error boundary if resetKeys changed
    if (hasError && resetKeys && this.hasResetKeysChanged(prevProps.resetKeys, resetKeys)) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private hasPropsChanged(prevProps: ErrorBoundaryProps): boolean {
    return JSON.stringify(prevProps) !== JSON.stringify(this.props)
  }

  private hasResetKeysChanged(prevKeys?: Array<string | number>, currentKeys?: Array<string | number>): boolean {
    if (!prevKeys && !currentKeys) return false
    if (!prevKeys || !currentKeys) return true
    if (prevKeys.length !== currentKeys.length) return true
    
    return prevKeys.some((key, index) => key !== currentKeys[index])
  }

  private logError = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      timestamp: new Date().toISOString(),
      props: this.props.isolate ? null : this.props // Don't log props if isolated
    }

    // Console log for development
    console.group(`🚨 Error Boundary Caught Error: ${errorId}`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Context:', this.props.context)
    console.table(errorData)
    console.groupEnd()

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, Bugsnag, etc.
      this.reportToErrorTracking(errorData)
    }
  }

  private reportToErrorTracking = async (errorData: Record<string, unknown>) => {
    try {
      // Example: Send to your error tracking endpoint
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }))

      // Auto-reset retry count after successful render
      this.resetTimeoutId = window.setTimeout(() => {
        this.setState({ retryCount: 0 })
      }, 30000) // Reset retry count after 30 seconds
    }
  }

  private handleReset = () => {
    this.resetErrorBoundary()
  }

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state
    
    if (error) {
      // Create error report
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        context: this.props.context,
        timestamp: new Date().toISOString()
      }

      // You can integrate with your support system here
      // For now, copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert('Error report copied to clipboard. Please paste this when contacting support.')
        })
        .catch(() => {
          console.log('Error Report:', errorReport)
          alert('Error report logged to console. Please copy from developer tools.')
        })
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    })
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state
    const { 
      children, 
      fallback, 
      showErrorDetails = true, 
      maxRetries = 3,
      context 
    } = this.props

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Render default error fallback
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          onReportError={this.handleReportError}
          showErrorDetails={showErrorDetails}
          context={context}
        />
      )
    }

    return children
  }
}

export default ErrorBoundary