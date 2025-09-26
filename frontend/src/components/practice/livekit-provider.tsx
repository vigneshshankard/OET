"use client"

import { useState, useEffect } from 'react'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'

interface LiveKitProviderProps {
  children: React.ReactNode
  roomName: string
  userName: string
  serverUrl?: string
  token?: string
}

// Mock token generation - in production this would come from your backend
const generateMockToken = (roomName: string, userName: string) => {
  // This is just for UI testing - real implementation needs proper JWT token from backend
  return `mock-token-${roomName}-${userName}-${Date.now()}`
}

export default function LiveKitProvider({ 
  children, 
  roomName, 
  userName,
  serverUrl = 'wss://your-livekit-server.com', // Replace with actual LiveKit server
  token 
}: LiveKitProviderProps) {
  const [connectionToken, setConnectionToken] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(true)

  useEffect(() => {
    // TODO: Replace with API call - POST /livekit/token
    const fetchToken = async () => {
      try {
        // const response = await apiCall('/livekit/token', {
        //   method: 'POST',
        //   body: JSON.stringify({ roomName, participantName: userName, sessionId })
        // })
        // const { token } = await response.json()
        // setConnectionToken(token)
        
        // MOCK implementation - replace with actual API call above
        const mockToken = generateMockToken(roomName, userName)
        setConnectionToken(mockToken)
      } catch (error) {
        console.error('Failed to fetch LiveKit token:', error)
      } finally {
        setIsConnecting(false)
      }
    }

    fetchToken()
  }, [roomName, userName])

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: '#36454F' }}>
            Connecting to practice session...
          </p>
        </div>
      </div>
    )
  }

  // Real LiveKit implementation
  if (!connectionToken) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm" style={{ color: '#36454F' }}>
            No connection token available
          </p>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={connectionToken}
      connect={true}
      audio={true}
      video={false}
      onConnected={() => {
        console.log('✅ Connected to LiveKit room:', roomName)
      }}
      onDisconnected={() => {
        console.log('❌ Disconnected from LiveKit room')
      }}
    >
      <RoomAudioRenderer />
      {children}
    </LiveKitRoom>
  )
}