/**
 * Error Reporting Service
 * Centralized error tracking and reporting for the OET platform
 */

// Specific metadata interfaces for different error types
export interface AuthenticationErrorMetadata {
  authProvider?: string
  authFlow?: string
  tokenExpired?: boolean
  permissionLevel?: string
}

export interface APIErrorMetadata {
  endpoint: string
  method: string
  statusCode?: number
  responseTime?: number
  retryCount?: number
  requestId?: string
}

export interface PracticeErrorMetadata {
  scenarioId?: string
  sessionId?: string
  phase?: string
  deviceType?: string
  connectionType?: string
}

export interface RealtimeErrorMetadata {
  roomId?: string
  participantId?: string
  connectionState?: string
  mediaType?: string
  errorCode?: string
}

export interface AdminErrorMetadata {
  adminAction?: string
  targetUserId?: string
  dataType?: string
  batchSize?: number
}

export interface GeneralErrorMetadata {
  componentName?: string
  actionType?: string
  userInput?: string
  browserInfo?: {
    version: string
    engine: string
    os: string
  }
}

// Allow additional properties for flexibility while maintaining type safety for common fields
export type ErrorMetadata = (
  | AuthenticationErrorMetadata
  | APIErrorMetadata
  | PracticeErrorMetadata
  | RealtimeErrorMetadata
  | AdminErrorMetadata
  | GeneralErrorMetadata
) & Record<string, unknown> // Allow additional properties

export interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  context?: string
  url: string
  userAgent: string
  userId?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'authentication' | 'api' | 'practice' | 'admin' | 'realtime' | 'general'
  metadata?: ErrorMetadata
}

export interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  topErrors: Array<{ message: string; count: number }>
  recentErrors: ErrorReport[]
}

class ErrorReportingService {
  private static instance: ErrorReportingService
  private errorQueue: ErrorReport[] = []
  private isOnline = true

  private constructor() {
    // Monitor online status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.flushErrorQueue()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService()
    }
    return ErrorReportingService.instance
  }

  /**
   * Report an error to the tracking system
   */
  async reportError(
    error: Error,
    context?: string,
    severity: ErrorReport['severity'] = 'medium',
    category: ErrorReport['category'] = 'general',
    metadata?: ErrorMetadata
  ): Promise<void> {
    const errorReport: ErrorReport = {
      errorId: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      context,
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      userId: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
      severity,
      category,
      metadata
    }

    // Store locally for recovery
    this.storeErrorLocally(errorReport)

    // Try to send immediately if online
    if (this.isOnline) {
      try {
        await this.sendErrorReport(errorReport)
      } catch (sendError) {
        console.warn('Failed to send error report immediately, queuing for retry:', sendError)
        this.errorQueue.push(errorReport)
      }
    } else {
      // Queue for later when online
      this.errorQueue.push(errorReport)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logErrorToConsole(errorReport)
    }
  }

  /**
   * Report a component error (from Error Boundaries)
   */
  async reportComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    context?: string,
    metadata?: ErrorMetadata
  ): Promise<void> {
    const enhancedMetadata = {
      ...metadata,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }

    await this.reportError(
      error,
      context,
      'high', // Component errors are high severity
      this.categorizeError(error, context),
      enhancedMetadata
    )
  }

  /**
   * Report an API error
   */
  async reportAPIError(
    error: Error,
    endpoint: string,
    method: string = 'GET',
    statusCode?: number,
    responseData?: unknown
  ): Promise<void> {
    const metadata = {
      endpoint,
      method,
      statusCode,
      responseData: responseData ? JSON.stringify(responseData).substring(0, 1000) : undefined,
      apiError: true
    }

    await this.reportError(
      error,
      `API: ${method} ${endpoint}`,
      statusCode && statusCode >= 500 ? 'high' : 'medium',
      'api',
      metadata
    )
  }

  /**
   * Report an authentication error
   */
  async reportAuthError(
    error: Error,
    action: string,
    metadata?: ErrorMetadata
  ): Promise<void> {
    const enhancedMetadata = {
      ...metadata,
      authAction: action,
      authError: true
    }

    await this.reportError(
      error,
      `Auth: ${action}`,
      'high', // Auth errors are always high severity
      'authentication',
      enhancedMetadata
    )
  }

  /**
   * Report a practice session error
   */
  async reportPracticeError(
    error: Error,
    sessionId?: string,
    scenarioId?: string,
    metadata?: ErrorMetadata
  ): Promise<void> {
    const enhancedMetadata = {
      ...metadata,
      sessionId,
      scenarioId,
      practiceError: true
    }

    await this.reportError(
      error,
      `Practice Session: ${sessionId || 'Unknown'}`,
      'medium',
      'practice',
      enhancedMetadata
    )
  }

  /**
   * Report a real-time connection error
   */
  async reportRealtimeError(
    error: Error,
    connectionType: 'webrtc' | 'websocket' | 'livekit',
    roomName?: string,
    metadata?: ErrorMetadata
  ): Promise<void> {
    const enhancedMetadata = {
      ...metadata,
      connectionType,
      roomName,
      realtimeError: true
    }

    await this.reportError(
      error,
      `Realtime: ${connectionType}`,
      'high', // Realtime errors affect core functionality
      'realtime',
      enhancedMetadata
    )
  }

  /**
   * Get error metrics for admin dashboard
   */
  async getErrorMetrics(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<ErrorMetrics> {
    try {
      const response = await fetch('/api/admin/errors/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ timeRange })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch error metrics: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch error metrics:', error)
      return this.getFallbackMetrics()
    }
  }

  /**
   * Get recent errors for admin dashboard
   */
  async getRecentErrors(limit: number = 50): Promise<ErrorReport[]> {
    try {
      const response = await fetch('/api/admin/errors/recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ limit })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch recent errors: ${response.statusText}`)
      }

      const data = await response.json()
      return data.errors || []
    } catch (error) {
      console.error('Failed to fetch recent errors:', error)
      return []
    }
  }

  /**
   * Clear user-specific error data (for privacy)
   */
  clearUserErrors(): void {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('error_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }

  // Private methods

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('auth_user')
        return user ? JSON.parse(user).id : undefined
      } catch {
        return undefined
      }
    }
    return undefined
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    if (typeof window !== 'undefined') {
      try {
        const key = `error_${errorReport.errorId}`
        localStorage.setItem(key, JSON.stringify(errorReport))
        
        // Clean up old errors (keep last 100)
        this.cleanupOldErrors()
      } catch (error) {
        console.warn('Failed to store error locally:', error)
      }
    }
  }

  private cleanupOldErrors(): void {
    if (typeof window !== 'undefined') {
      const errorKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('error_'))
        .sort()

      if (errorKeys.length > 100) {
        const keysToRemove = errorKeys.slice(0, errorKeys.length - 100)
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    const response = await fetch('/api/errors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(errorReport)
    })

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.statusText}`)
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    for (const errorReport of errors) {
      try {
        await this.sendErrorReport(errorReport)
      } catch (error) {
        console.warn('Failed to send queued error report:', error)
        // Don't re-queue to avoid infinite loops
      }
    }
  }

  private categorizeError(error: Error, context?: string): ErrorReport['category'] {
    const message = error.message.toLowerCase()
    const contextLower = context?.toLowerCase() || ''

    if (contextLower.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication'
    }
    
    if (contextLower.includes('api') || message.includes('fetch') || message.includes('network')) {
      return 'api'
    }
    
    if (contextLower.includes('practice') || contextLower.includes('session')) {
      return 'practice'
    }
    
    if (contextLower.includes('admin') || contextLower.includes('dashboard')) {
      return 'admin'
    }
    
    if (contextLower.includes('realtime') || contextLower.includes('livekit') || contextLower.includes('webrtc')) {
      return 'realtime'
    }

    return 'general'
  }

  private logErrorToConsole(errorReport: ErrorReport): void {
    const emoji = this.getSeverityEmoji(errorReport.severity)
    
    console.group(`${emoji} Error Report: ${errorReport.errorId}`)
    console.error('Message:', errorReport.message)
    console.error('Context:', errorReport.context)
    console.error('Category:', errorReport.category)
    console.error('Severity:', errorReport.severity)
    console.error('Stack:', errorReport.stack)
    console.error('Metadata:', errorReport.metadata)
    console.groupEnd()
  }

  private getSeverityEmoji(severity: ErrorReport['severity']): string {
    switch (severity) {
      case 'low': return '🟡'
      case 'medium': return '🟠'
      case 'high': return '🔴'
      case 'critical': return '💥'
      default: return '⚠️'
    }
  }

  private getFallbackMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      topErrors: [],
      recentErrors: []
    }
  }
}

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorReporting = ErrorReportingService.getInstance()
    errorReporting.reportError(
      new Error(event.message),
      'Global Error Handler',
      'high',
      'general',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        globalError: true
      }
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    const errorReporting = ErrorReportingService.getInstance()
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    errorReporting.reportError(
      error,
      'Unhandled Promise Rejection',
      'high',
      'general',
      {
        unhandledRejection: true
      }
    )
  })
}

export default ErrorReportingService.getInstance()