"use client"

import { useState, useEffect } from 'react'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'
import { apiRequest } from '@/lib/api-utils'
import { RealtimeErrorBoundary } from '@/components/error-boundary'

interface LiveKitProviderProps {
  children: React.ReactNode
  roomName: string
  userName: string
  serverUrl?: string
  token?: string
}

// Generate real token from backend API
const generateLiveKitToken = async (roomName: string, userName: string): Promise<string> => {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        roomName,
        userName,
        permissions: {
          canSubscribe: true,
          canPublish: true,
          canPublishData: true
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Token generation failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error)
    throw error
  }
}

export default function LiveKitProvider({ 
  children, 
  roomName, 
  userName,
  serverUrl = 'wss://localhost:7880', // Default LiveKit server
  token 
}: LiveKitProviderProps) {
  const [connectionToken, setConnectionToken] = useState<string>('')
  const [actualServerUrl, setActualServerUrl] = useState<string>(serverUrl)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('🔐 Fetching LiveKit token for room:', roomName)
        
        // If we already have a token passed as prop, use it
        if (token) {
          setConnectionToken(token)
          return
        }

        // Request token from backend API using API utility
        const tokenData = await apiRequest<{token: string, url: string, roomName: string}>(
          '/v1/livekit/token',
          {
            method: 'POST',
            body: JSON.stringify({ 
              roomName, 
              participantName: userName 
            })
          }
        )

        setConnectionToken(tokenData.token)
        
        // Update server URL if provided
        if (tokenData.url && tokenData.url !== serverUrl) {
          console.log('📡 Using LiveKit server URL from token:', tokenData.url)
          setActualServerUrl(tokenData.url)
        }
        
        console.log('✅ LiveKit token obtained successfully')
        setConnectionError(null)
        setRetryCount(0)
      } catch (error) {
        console.error('❌ Failed to fetch LiveKit token:', error)
        setConnectionError(error instanceof Error ? error.message : 'Failed to get connection token')
        
        // For critical production use, retry with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`🔄 Retrying token fetch in ${delay}ms (attempt ${retryCount + 1}/3)`)
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            // Token fetch will retry due to dependency change
          }, delay)
        }
      } finally {
        setIsConnecting(false)
        setIsRetrying(false)
      }
    }

    fetchToken()
  }, [roomName, userName, token])

  // Retry connection function
  const retryConnection = async () => {
    if (retryCount >= 3) {
      setConnectionError('Maximum retry attempts reached. Please refresh the page.')
      return
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    console.log(`🔄 Retrying connection (attempt ${retryCount + 1}/3)`)
    
    // Wait before retrying (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
    
    // Reset states and try again
    setConnectionError(null)
    setIsConnecting(true)
    
    // Re-trigger the fetch
    const fetchToken = async () => {
      try {
        console.log('🔐 Fetching LiveKit token for room:', roomName)
        
        if (token) {
          setConnectionToken(token)
          return
        }

        const tokenData = await apiRequest<{token: string, url: string, roomName: string}>(
          '/v1/livekit/token',
          {
            method: 'POST',
            body: JSON.stringify({ 
              roomName, 
              participantName: userName 
            })
          }
        )

        setConnectionToken(tokenData.token)
        
        if (tokenData.url && tokenData.url !== serverUrl) {
          console.log('📡 Using LiveKit server URL from token:', tokenData.url)
          setActualServerUrl(tokenData.url)
        }

        console.log('✅ LiveKit token obtained successfully')
        setConnectionError(null)
        setRetryCount(0)
      } catch (error) {
        console.error('❌ Failed to fetch LiveKit token:', error)
        setConnectionError(error instanceof Error ? error.message : 'Failed to get connection token')
        
        // In production, we should not fall back - this indicates a configuration issue
        console.error('LiveKit token generation failed and no fallback available')
        setConnectionError('Unable to establish real-time connection')
      } finally {
        setIsConnecting(false)
        setIsRetrying(false)
      }
    }

    await fetchToken()
  }

  if (isConnecting || isRetrying) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: '#36454F' }}>
            {isRetrying ? `Retrying connection (${retryCount}/3)...` : 'Connecting to practice session...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (connectionError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: '#36454F' }}>
            Connection Failed
          </h3>
          <p className="text-sm mb-4 text-gray-600">
            {connectionError}
          </p>
          {retryCount < 3 && (
            <button
              onClick={retryConnection}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Retry Connection
            </button>
          )}
          {retryCount >= 3 && (
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    )
  }

  // Show loading state if no token yet
  if (!connectionToken) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: '#36454F' }}>
            Preparing connection...
          </p>
        </div>
      </div>
    )
  }

  return (
    <RealtimeErrorBoundary
      connectionType="livekit"
      onConnectionError={(error) => {
        console.error('LiveKit error boundary caught error:', error)
        setConnectionError(`Critical connection error: ${error.message}`)
      }}
      onFallbackMode={() => {
        console.log('Switching to fallback mode - no real-time audio')
        // Could redirect to a text-based practice mode
      }}
    >
      <LiveKitRoom
        serverUrl={actualServerUrl}
        token={connectionToken}
        connect={true}
        audio={true}
        video={false}
        options={{
          publishDefaults: {
            audioPreset: {
              maxBitrate: 64000
            }
          }
        }}
        onConnected={() => {
          console.log('✅ Connected to LiveKit room:', roomName)
          setConnectionError(null)
          setRetryCount(0)
        }}
        onDisconnected={(reason) => {
          console.log('❌ Disconnected from LiveKit room:', reason)
          // Auto-retry on unexpected disconnection
          if (reason && retryCount < 3) {
            console.log('🔄 Attempting automatic reconnection...')
            setTimeout(() => retryConnection(), 2000)
          }
        }}
        onError={(error) => {
          console.error('❌ LiveKit connection error:', error)
          setConnectionError(`Connection error: ${error.message}`)
          
          // Auto-retry on certain errors
          if (error.message.includes('WebSocket') || error.message.includes('network')) {
            setTimeout(() => retryConnection(), 3000)
          }
        }}
      >
        <RoomAudioRenderer />
        {children}
      </LiveKitRoom>
    </RealtimeErrorBoundary>
  )
}