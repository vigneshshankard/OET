// Main error boundary components
export { default as ErrorBoundary } from './error-boundary'
export {
  AuthErrorBoundary,
  APIErrorBoundary,
  PracticeErrorBoundary,
  AdminErrorBoundary,
  RealtimeErrorBoundary
} from './specialized-boundaries'

// Higher-order components and hooks
export {
  withErrorBoundary,
  withAuthErrorBoundary,
  withAPIErrorBoundary,
  withPracticeErrorBoundary,
  withAdminErrorBoundary,
  withRealtimeErrorBoundary,
  useErrorHandler,
  ErrorProvider,
  useErrorContext
} from './error-boundary-hoc'

// Error recovery and graceful degradation
export { default as ErrorRecovery, useErrorRecovery } from './error-recovery'
export { 
  default as GracefulDegradation,
  AudioFeatureDegradation,
  NetworkFeatureDegradation
} from './graceful-degradation'

// Error reporting service
export { default as ErrorReportingService } from '../../services/error-reporting'

// Admin components
export { default as ErrorMonitoringDashboard } from '../admin/error-monitoring-dashboard'

// Re-export types
export type { default as ErrorBoundaryProps } from './error-boundary'