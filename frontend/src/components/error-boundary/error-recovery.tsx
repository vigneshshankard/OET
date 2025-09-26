'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Wifi,
  Server,
  Database
} from 'lucide-react'

interface ErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
  showProgress?: boolean
  onRetry?: () => Promise<void>
  onSuccess?: () => void
  onFailure?: (error: Error) => void
  fallbackAction?: () => void
  fallbackLabel?: string
}

interface ErrorRecoveryProps extends ErrorRecoveryOptions {
  error: Error
  context?: string
  children?: React.ReactNode
}

interface RetryState {
  isRetrying: boolean
  currentAttempt: number
  nextRetryIn: number
  lastError: Error | null
  hasSucceeded: boolean
  hasFailed: boolean
}

const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  context = 'Operation',
  maxRetries = 3,
  retryDelay = 1000,
  exponentialBackoff = true,
  showProgress = true,
  onRetry,
  onSuccess,
  onFailure,
  fallbackAction,
  fallbackLabel = 'Use Fallback',
  children
}) => {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    nextRetryIn: 0,
    lastError: error,
    hasSucceeded: false,
    hasFailed: false
  })

  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    }
  }, [countdownTimer])

  const calculateDelay = useCallback((attempt: number): number => {
    if (!exponentialBackoff) {
      return retryDelay
    }
    
    // Exponential backoff with jitter
    const baseDelay = retryDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 0.1 * baseDelay
    return Math.min(baseDelay + jitter, 30000) // Cap at 30 seconds
  }, [retryDelay, exponentialBackoff])

  const startCountdown = useCallback((delay: number) => {
    setRetryState(prev => ({ ...prev, nextRetryIn: Math.ceil(delay / 1000) }))
    
    const timer = setInterval(() => {
      setRetryState(prev => {
        if (prev.nextRetryIn <= 1) {
          clearInterval(timer)
          return { ...prev, nextRetryIn: 0 }
        }
        return { ...prev, nextRetryIn: prev.nextRetryIn - 1 }
      })
    }, 1000)
    
    setCountdownTimer(timer)
  }, [])

  const handleRetry = useCallback(async (manual: boolean = false) => {
    if (retryState.isRetrying || retryState.hasSucceeded) return
    
    const newAttempt = manual ? 1 : retryState.currentAttempt + 1
    
    if (newAttempt > maxRetries) {
      setRetryState(prev => ({ ...prev, hasFailed: true }))
      onFailure?.(retryState.lastError || error)
      return
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      currentAttempt: newAttempt,
      nextRetryIn: 0,
      hasFailed: false
    }))

    if (countdownTimer) {
      clearInterval(countdownTimer)
      setCountdownTimer(null)
    }

    try {
      if (onRetry) {
        await onRetry()
      }
      
      // Success
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        hasSucceeded: true,
        lastError: null
      }))
      
      onSuccess?.()
    } catch (retryError) {
      const err = retryError instanceof Error ? retryError : new Error(String(retryError))
      
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: err
      }))

      // Schedule next retry if we haven't reached max attempts
      if (newAttempt < maxRetries) {
        const delay = calculateDelay(newAttempt - 1)
        startCountdown(delay)
        
        setTimeout(() => {
          handleRetry(false)
        }, delay)
      } else {
        setRetryState(prev => ({ ...prev, hasFailed: true }))
        onFailure?.(err)
      }
    }
  }, [
    retryState.isRetrying,
    retryState.hasSucceeded,
    retryState.currentAttempt,
    retryState.lastError,
    maxRetries,
    onRetry,
    onSuccess,
    onFailure,
    error,
    calculateDelay,
    startCountdown,
    countdownTimer
  ])

  const handleManualRetry = () => {
    setRetryState({
      isRetrying: false,
      currentAttempt: 0,
      nextRetryIn: 0,
      lastError: error,
      hasSucceeded: false,
      hasFailed: false
    })
    handleRetry(true)
  }

  const getErrorIcon = () => {
    const errorMessage = (retryState.lastError || error).message.toLowerCase()
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return <Wifi className="w-6 h-6 text-orange-600" />
    }
    
    if (errorMessage.includes('server') || errorMessage.includes('api')) {
      return <Server className="w-6 h-6 text-red-600" />
    }
    
    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      return <Database className="w-6 h-6 text-purple-600" />
    }
    
    return <AlertTriangle className="w-6 h-6 text-red-600" />
  }

  const getRetryProgress = () => {
    if (maxRetries === 0) return 0
    return (retryState.currentAttempt / maxRetries) * 100
  }

  if (retryState.hasSucceeded) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          {context} recovered successfully after {retryState.currentAttempt} attempt{retryState.currentAttempt !== 1 ? 's' : ''}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          {retryState.isRetrying ? (
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          ) : retryState.hasFailed ? (
            <XCircle className="w-6 h-6 text-red-600" />
          ) : (
            getErrorIcon()
          )}
          
          <div>
            <CardTitle className="text-lg">
              {retryState.isRetrying 
                ? `Retrying ${context}...`
                : retryState.hasFailed
                ? `${context} Failed`
                : `${context} Error`
              }
            </CardTitle>
            <CardDescription>
              {retryState.isRetrying 
                ? `Attempt ${retryState.currentAttempt} of ${maxRetries}`
                : retryState.hasFailed
                ? 'All retry attempts exhausted'
                : (retryState.lastError || error).message
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Details */}
        {!retryState.isRetrying && !retryState.hasFailed && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {(retryState.lastError || error).message}
              {context && (
                <div className="mt-1">
                  <strong>Context:</strong> {context}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Retry Progress */}
        {showProgress && maxRetries > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Retry Progress</span>
              <span>{retryState.currentAttempt} / {maxRetries}</span>
            </div>
            <Progress value={getRetryProgress()} className="w-full" />
          </div>
        )}

        {/* Countdown Timer */}
        {retryState.nextRetryIn > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Next retry in {retryState.nextRetryIn} second{retryState.nextRetryIn !== 1 ? 's' : ''}...
            </AlertDescription>
          </Alert>
        )}

        {/* Retry Status */}
        {retryState.isRetrying && (
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Attempting to recover... Please wait.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!retryState.isRetrying && !retryState.hasSucceeded && (
            <Button 
              onClick={handleManualRetry}
              className="flex items-center gap-2"
              disabled={retryState.nextRetryIn > 0}
            >
              <RefreshCw className="w-4 h-4" />
              {retryState.hasFailed ? 'Try Again' : 'Retry Now'}
            </Button>
          )}

          {fallbackAction && (
            <Button 
              onClick={fallbackAction}
              variant="outline"
              className="flex items-center gap-2"
            >
              {fallbackLabel}
            </Button>
          )}

          {retryState.hasFailed && (
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
          )}
        </div>

        {/* Custom Recovery Content */}
        {children && (
          <div className="pt-4 border-t">
            {children}
          </div>
        )}

        {/* Technical Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-50 rounded border">
            <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
            <div className="mt-2 text-xs space-y-2">
              <div><strong>Error:</strong> {(retryState.lastError || error).name}</div>
              <div><strong>Message:</strong> {(retryState.lastError || error).message}</div>
              {(retryState.lastError || error).stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                    {(retryState.lastError || error).stack}
                  </pre>
                </div>
              )}
              <div><strong>Retry Config:</strong></div>
              <ul className="ml-4 space-y-1">
                <li>Max Retries: {maxRetries}</li>
                <li>Base Delay: {retryDelay}ms</li>
                <li>Exponential Backoff: {exponentialBackoff ? 'Yes' : 'No'}</li>
                <li>Current Attempt: {retryState.currentAttempt}</li>
              </ul>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

export default ErrorRecovery

// Hook for easy error recovery integration
export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const [error, setError] = useState<Error | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)

  const recover = useCallback(async (retryFn?: () => Promise<void>) => {
    if (!error) return

    setIsRecovering(true)
    
    try {
      if (retryFn) {
        await retryFn()
      } else if (options.onRetry) {
        await options.onRetry()
      }
      
      setError(null)
      options.onSuccess?.()
    } catch (recoveryError) {
      const err = recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError))
      setError(err)
      options.onFailure?.(err)
    } finally {
      setIsRecovering(false)
    }
  }, [error, options])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reportError = useCallback((err: Error) => {
    setError(err)
  }, [])

  return {
    error,
    isRecovering,
    recover,
    clearError,
    reportError
  }
}