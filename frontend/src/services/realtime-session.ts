import { apiRequest } from '@/lib/api-utils'

export interface SessionData {
  sessionId: string
  roomName: string
  userToken: string
  serverUrl: string
  websocketUrl: string
}

export interface ConversationMessage {
  type: 'user' | 'ai' | 'system'
  text: string
  timestamp: string
  confidence?: number
}

class RealTimeSessionService {
  private websocket: WebSocket | null = null
  private sessionId: string | null = null
  private onMessageCallbacks: ((message: ConversationMessage) => void)[] = []
  private onErrorCallbacks: ((error: string) => void)[] = []
  private onStatusChangeCallbacks: ((status: string) => void)[] = []

  /**
   * Create a new practice session with LiveKit room
   */
  async createSession(scenarioId: string, userId: string, profession: string): Promise<SessionData> {
    try {
      console.log('🚀 Creating new practice session...')
      
      const response = await fetch('http://localhost:8005/api/sessions/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenarioId,
          userId,
          profession
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const sessionData = await response.json()
      this.sessionId = sessionData.sessionId
      
      console.log('✅ Session created:', sessionData.sessionId)
      
      return sessionData
    } catch (error) {
      console.error('❌ Error creating session:', error)
      throw error
    }
  }

  /**
   * Connect to WebSocket for real-time communication
   */
  connectWebSocket(websocketUrl: string) {
    try {
      console.log('🔗 Connecting to WebSocket:', websocketUrl)
      
      this.websocket = new WebSocket(websocketUrl)
      
      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected')
        this.notifyStatusChange('connected')
        
        // Start the session
        this.sendMessage({
          type: 'session_start',
          timestamp: new Date().toISOString()
        })
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      this.websocket.onclose = () => {
        console.log('❌ WebSocket disconnected')
        this.notifyStatusChange('disconnected')
      }

      this.websocket.onerror = (error) => {
        console.error('🚨 WebSocket error:', error)
        this.notifyError('WebSocket connection error')
      }

      // Heartbeat
      this.startHeartbeat()

    } catch (error) {
      console.error('❌ Error connecting WebSocket:', error)
      throw error
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    console.log('📨 Received WebSocket message:', data.type)

    switch (data.type) {
      case 'ai_response':
      case 'ai_greeting':
        this.notifyMessage({
          type: 'ai',
          text: data.text,
          timestamp: new Date().toISOString(),
          confidence: data.confidence
        })
        break

      case 'tts_chunk':
        // Play TTS audio chunk
        this.playTTSAudio(data.data)
        break

      case 'session_started':
        console.log('✅ Session started successfully')
        this.notifyStatusChange('active')
        break

      case 'error':
        console.error('❌ Session error:', data.message)
        this.notifyError(data.message)
        break

      case 'pong':
        // Heartbeat response
        break

      default:
        console.log('❓ Unknown message type:', data.type)
    }
  }

  /**
   * Send audio data for AI processing
   */
  async sendAudioData(audioBlob: Blob, transcript?: string) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected')
      return
    }

    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const base64Audio = btoa(binaryString)

      console.log('🎵 Sending audio data for processing...')

      this.sendMessage({
        type: 'audio',
        data: base64Audio,
        transcript: transcript || null,
        timestamp: new Date().toISOString()
      })

      // Add user message to conversation if transcript available
      if (transcript) {
        this.notifyMessage({
          type: 'user',
          text: transcript,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      console.error('❌ Error sending audio data:', error)
      this.notifyError('Failed to send audio data')
    }
  }

  /**
   * Send text message for AI processing
   */
  async sendTextMessage(text: string) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected')
      return
    }

    try {
      console.log('💬 Sending text message for processing...')

      this.sendMessage({
        type: 'text',
        content: text,
        timestamp: new Date().toISOString()
      })

      // Add user message to conversation
      this.notifyMessage({
        type: 'user',
        text: text,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Error sending text message:', error)
      this.notifyError('Failed to send text message')
    }
  }

  /**
   * Send message via WebSocket
   */
  private sendMessage(message: any) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    }
  }

  /**
   * Play TTS audio chunk
   */
  private playTTSAudio(base64AudioData: string) {
    try {
      const audioData = atob(base64AudioData)
      const audioArray = new Uint8Array(audioData.length)
      
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i)
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.play().then(() => {
        console.log('🔊 Playing AI response audio')
      }).catch((error) => {
        console.error('❌ Error playing audio:', error)
      })

      // Clean up URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
      }

    } catch (error) {
      console.error('❌ Error playing TTS audio:', error)
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() })
      }
    }, 30000) // Send ping every 30 seconds
  }

  /**
   * Get session info
   */
  async getSessionInfo(): Promise<any> {
    if (!this.sessionId) return null

    try {
      const response = await fetch(`http://localhost:8005/api/sessions/${this.sessionId}`)
      return await response.json()
    } catch (error) {
      console.error('❌ Error getting session info:', error)
      return null
    }
  }

  /**
   * Complete session
   */
  async completeSession() {
    console.log('✅ Completing session...')
    
    if (this.websocket) {
      this.websocket.close()
    }

    this.notifyStatusChange('completed')
  }

  /**
   * Event listeners
   */
  onMessage(callback: (message: ConversationMessage) => void) {
    this.onMessageCallbacks.push(callback)
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallbacks.push(callback)
  }

  onStatusChange(callback: (status: string) => void) {
    this.onStatusChangeCallbacks.push(callback)
  }

  /**
   * Notification methods
   */
  private notifyMessage(message: ConversationMessage) {
    this.onMessageCallbacks.forEach(callback => callback(message))
  }

  private notifyError(error: string) {
    this.onErrorCallbacks.forEach(callback => callback(error))
  }

  private notifyStatusChange(status: string) {
    this.onStatusChangeCallbacks.forEach(callback => callback(status))
  }

  /**
   * Clean up resources
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    
    this.sessionId = null
    this.onMessageCallbacks = []
    this.onErrorCallbacks = []
    this.onStatusChangeCallbacks = []
  }
}

export const realTimeSessionService = new RealTimeSessionService()
export default RealTimeSessionService