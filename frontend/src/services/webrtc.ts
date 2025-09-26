// WebRTC service for managing real-time connections

export interface CreateRoomRequest {
  scenarioId: string
  userId: string
  profession: string
}

export interface CreateRoomResponse {
  sessionId: string
  roomName: string
  serverUrl: string
  userToken: string
  participantToken?: string
}

export class WebRTCService {
  async createRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
    // Mock implementation for testing
    return {
      sessionId: `webrtc-session-${Date.now()}`,
      roomName: `practice_${data.scenarioId}_${Date.now()}`,
      serverUrl: 'ws://localhost:7880',
      userToken: 'mock-livekit-user-token',
      participantToken: 'mock-participant-token',
    }
  }

  async joinRoom(roomName: string, token: string): Promise<void> {
    // Mock implementation
    console.log(`Joining room: ${roomName} with token: ${token}`)
  }

  async leaveRoom(): Promise<void> {
    // Mock implementation
    console.log('Leaving room')
  }

  async sendMessage(message: string): Promise<void> {
    // Mock implementation
    console.log(`Sending message: ${message}`)
  }
}

export const webrtcService = new WebRTCService()