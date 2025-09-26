// Session service for managing practice sessions

export interface PracticeSession {
  id: string
  user_id: string
  scenario_id: string
  status: 'created' | 'active' | 'paused' | 'completed'
  livekit_room_name: string
  livekit_token?: string
  start_time: string
  end_time?: string
  duration?: number
}

export interface CreateSessionRequest {
  scenario_id: string
  user_id: string
  livekit_room_name?: string
}

export interface CreateSessionResponse {
  practice_session: PracticeSession
}

export interface CompleteSessionResponse {
  practice_session: Partial<PracticeSession>
}

export class SessionService {
  async createPracticeSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    // Mock implementation for testing
    const session: PracticeSession = {
      id: `session-${Date.now()}`,
      user_id: data.user_id,
      scenario_id: data.scenario_id,
      status: 'created',
      livekit_room_name: data.livekit_room_name || `practice_${data.scenario_id}_${Date.now()}`,
      livekit_token: 'mock-livekit-token',
      start_time: new Date().toISOString(),
    }

    return { practice_session: session }
  }

  async completePracticeSession(sessionId: string): Promise<CompleteSessionResponse> {
    // Mock implementation
    return {
      practice_session: {
        id: sessionId,
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: 300, // 5 minutes
      }
    }
  }

  async getSessionDetails(sessionId: string): Promise<{ practice_session: PracticeSession }> {
    // Mock implementation
    return {
      practice_session: {
        id: sessionId,
        user_id: 'user-123',
        scenario_id: 'scenario-123',
        status: 'active',
        livekit_room_name: `practice_scenario-123_${Date.now()}`,
        start_time: new Date().toISOString(),
      }
    }
  }
}

export const sessionService = new SessionService()