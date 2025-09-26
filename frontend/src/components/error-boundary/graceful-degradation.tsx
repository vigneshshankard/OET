'use client'

import React, { useState, useEffect, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Server,
  Database,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react'

interface FeatureStatus {
  available: boolean
  lastChecked: Date
  error?: Error
  degradationLevel: 'none' | 'partial' | 'full'
}

interface GracefulDegradationProps {
  children: ReactNode
  featureName: string
  fallbackComponent?: ReactNode
  checkFeature?: () => Promise<boolean>
  checkInterval?: number
  onDegradation?: (level: 'partial' | 'full', reason: string) => void
  onRecovery?: () => void
  showStatus?: boolean
  criticalFeature?: boolean
}

const GracefulDegradation: React.FC<GracefulDegradationProps> = ({
  children,
  featureName,
  fallbackComponent,
  checkFeature,
  checkInterval = 30000, // 30 seconds
  onDegradation,
  onRecovery,
  showStatus = false,
  criticalFeature = false
}) => {
  const [status, setStatus] = useState<FeatureStatus>({
    available: true,
    lastChecked: new Date(),
    degradationLevel: 'none'
  })

  const [isChecking, setIsChecking] = useState(false)
  const [userDismissed, setUserDismissed] = useState(false)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const performCheck = async () => {
      if (!checkFeature || isChecking) return

      setIsChecking(true)
      
      try {
        const isAvailable = await checkFeature()
        const currentTime = new Date()
        
        setStatus(prev => {
          const newStatus: FeatureStatus = {
            available: isAvailable,
            lastChecked: currentTime,
            degradationLevel: isAvailable ? 'none' : (prev.degradationLevel === 'none' ? 'partial' : 'full'),
            error: isAvailable ? undefined : prev.error
          }

          // Trigger callbacks on status change
          if (prev.available && !isAvailable) {
            const degradationLevel = newStatus.degradationLevel
            if (degradationLevel !== 'none') {
              onDegradation?.(degradationLevel, `${featureName} became unavailable`)
            }
          } else if (!prev.available && isAvailable) {
            onRecovery?.()
          }

          return newStatus
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        
        setStatus(prev => ({
          available: false,
          lastChecked: new Date(),
          error: err,
          degradationLevel: 'full'
        }))

        if (status.available) {
          onDegradation?.('full', err.message)
        }
      } finally {
        setIsChecking(false)
      }
    }

    // Initial check
    if (checkFeature) {
      performCheck()
    }

    // Set up interval checking
    if (checkFeature && checkInterval > 0) {
      intervalId = setInterval(performCheck, checkInterval)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [checkFeature, checkInterval, featureName, isChecking, onDegradation, onRecovery, status.available])

  const getStatusIcon = () => {
    if (isChecking) {
      return <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
    }

    switch (status.degradationLevel) {
      case 'none':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'full':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = () => {
    switch (status.degradationLevel) {
      case 'none':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'partial':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'full':
        return 'border-red-200 bg-red-50 text-red-800'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800'
    }
  }

  const getFeatureIcon = () => {
    const name = featureName.toLowerCase()
    
    if (name.includes('audio') || name.includes('mic')) {
      return status.available ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />
    }
    if (name.includes('video') || name.includes('camera')) {
      return status.available ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />
    }
    if (name.includes('network') || name.includes('connection')) {
      return status.available ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />
    }
    if (name.includes('api') || name.includes('server')) {
      return <Server className="w-4 h-4" />
    }
    if (name.includes('database') || name.includes('storage')) {
      return <Database className="w-4 h-4" />
    }
    
    return null
  }

  const shouldShowFallback = () => {
    return status.degradationLevel === 'full' || (criticalFeature && status.degradationLevel === 'partial')
  }

  const renderStatusAlert = () => {
    if (userDismissed || status.degradationLevel === 'none') return null

    const messages = {
      partial: `${featureName} is experiencing issues. Some functionality may be limited.`,
      full: `${featureName} is currently unavailable. Using fallback mode.`
    }

    return (
      <Alert className={`mb-4 ${getStatusColor()}`}>
        {getStatusIcon()}
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>{status.degradationLevel === 'partial' ? 'Limited Functionality' : 'Service Unavailable'}</strong>
            <div className="mt-1">{messages[status.degradationLevel]}</div>
            {status.error && (
              <div className="text-sm mt-2">
                <strong>Reason:</strong> {status.error.message}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserDismissed(true)}
            className="ml-4"
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const renderStatusBadge = () => {
    if (!showStatus) return null

    const badgeText = {
      none: 'Operational',
      partial: 'Limited',
      full: 'Unavailable'
    }

    const badgeVariant = {
      none: 'default' as const,
      partial: 'secondary' as const,
      full: 'destructive' as const
    }

    return (
      <div className="flex items-center gap-2 mb-2">
        {getFeatureIcon()}
        <span className="text-sm font-medium">{featureName}</span>
        <Badge variant={badgeVariant[status.degradationLevel]}>
          {getStatusIcon()}
          <span className="ml-1">{badgeText[status.degradationLevel]}</span>
        </Badge>
        {status.lastChecked && (
          <span className="text-xs text-gray-500">
            Last checked: {status.lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>
    )
  }

  const renderFallback = () => {
    if (fallbackComponent) {
      return fallbackComponent
    }

    // Default fallback UI
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            {featureName} Unavailable
          </CardTitle>
          <CardDescription>
            This feature is currently experiencing issues and has been temporarily disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {status.error.message}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-sm text-gray-600">
              <p>We're working to restore full functionality. In the meantime:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              {checkFeature && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setUserDismissed(false)
                    // Trigger immediate recheck
                    checkFeature().then(isAvailable => {
                      setStatus(prev => ({
                        ...prev,
                        available: isAvailable,
                        lastChecked: new Date(),
                        degradationLevel: isAvailable ? 'none' : prev.degradationLevel
                      }))
                    }).catch(error => {
                      const err = error instanceof Error ? error : new Error(String(error))
                      setStatus(prev => ({
                        ...prev,
                        available: false,
                        lastChecked: new Date(),
                        error: err
                      }))
                    })
                  }}
                  disabled={isChecking}
                >
                  {isChecking ? 'Checking...' : 'Check Again'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {renderStatusBadge()}
      {renderStatusAlert()}
      
      {shouldShowFallback() ? renderFallback() : children}
    </div>
  )
}

export default GracefulDegradation

// Predefined degradation components for common features

export const AudioFeatureDegradation: React.FC<{
  children: ReactNode
  onAudioUnavailable?: () => void
  showTextFallback?: boolean
}> = ({ children, onAudioUnavailable, showTextFallback = true }) => {
  const checkAudioFeature = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false
      }
      
      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch {
      return false
    }
  }

  const fallback = showTextFallback ? (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MicOff className="w-5 h-5 text-orange-600" />
          Audio Unavailable - Text Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Audio features are not available. You can continue with text-based practice.
        </p>
        <Button onClick={onAudioUnavailable}>
          Continue with Text Practice
        </Button>
      </CardContent>
    </Card>
  ) : undefined

  return (
    <GracefulDegradation
      featureName="Audio Recording"
      checkFeature={checkAudioFeature}
      fallbackComponent={fallback}
      onDegradation={() => onAudioUnavailable?.()}
      criticalFeature={true}
      showStatus={true}
    >
      {children}
    </GracefulDegradation>
  )
}

export const NetworkFeatureDegradation: React.FC<{
  children: ReactNode
  endpoint?: string
  onNetworkUnavailable?: () => void
}> = ({ children, endpoint = '/api/health', onNetworkUnavailable }) => {
  const checkNetworkFeature = async (): Promise<boolean> => {
    try {
      const response = await fetch(endpoint, { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }

  return (
    <GracefulDegradation
      featureName="Network Connection"
      checkFeature={checkNetworkFeature}
      onDegradation={() => onNetworkUnavailable?.()}
      showStatus={true}
      checkInterval={10000} // Check every 10 seconds
    >
      {children}
    </GracefulDegradation>
  )
}