/**
 * OET Praxis API Client
 * Real implementation connecting to backend gateway at localhost:8000
 */

import { config } from '@/config/app'

// Configuration  
const API_BASE_URL = `${config.api.baseUrl}/v1`

// Core API Types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserProfile
  expiresIn: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  profession: string
  subscription?: {
    id: string
    plan: string
    status: string
    expiresAt: string
  }
}

export interface Scenario {
  id: string
  title: string
  description: string
  patient_persona: any
  clinical_area: string
  difficulty_level: string
  profession: string
  status: string
  created_at: string
}

export interface Dialogue {
  id: string
  scenario_id: string
  speaker: 'user' | 'patient'
  message: string
  expected_response?: string
  order_number: number
  metadata: any
}

export interface ScenarioWithDialogues extends Scenario {
  dialogues: Dialogue[]
}

export interface UserProgress {
  id: string
  user_id: string
  scenario_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  current_dialogue_id?: string
  score?: number
  completed_at?: string
  time_spent: number
  attempts: number
  last_accessed_at: string
  scenario_title?: string
}

export interface ProgressStats {
  total_scenarios: number
  completed_scenarios: number
  in_progress_scenarios: number
  average_score: number
  total_time_spent: number
  total_attempts: number
  recent_progress: UserProgress[]
}

export interface CreateSessionRequest {
  user_id: string
  scenario_id: string
  livekit_room_name: string
  livekit_token?: string
  metadata?: any
}

export interface PracticeSession {
  id: string
  user_id: string
  scenario_id: string
  status: string
  livekit_room_name: string
  start_time: string
  end_time?: string
  duration?: number
}

export interface ConversationRequest {
  session_id: string
  user_audio: string
  context: any
}

export interface ConversationResponse {
  response_text: string
  audio_url?: string
  confidence: number
  feedback?: any
}

export interface FeedbackRequest {
  session_id: string
  conversation_data: any
  criteria: string[]
}

export interface FeedbackResponse {
  overall_score: number
  detailed_feedback: any
  areas_for_improvement: string[]
  strengths: string[]
}

// API Client with error handling and authentication
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(config.auth.tokenKey)
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem(config.auth.tokenKey, token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(config.auth.tokenKey)
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    this.setToken(response.accessToken)
    return response
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' })
    this.clearToken()
  }

  // Content endpoints
  async getScenarios(filters?: { profession?: string; difficulty?: string }): Promise<{ scenarios: Scenario[]; total: number }> {
    const params = new URLSearchParams(filters as Record<string, string>).toString()
    const endpoint = `/content/scenarios${params ? `?${params}` : ''}`
    return this.request<{ scenarios: Scenario[]; total: number }>(endpoint)
  }

  async getScenario(scenarioId: string): Promise<{ scenario: Scenario }> {
    return this.request<{ scenario: Scenario }>(`/content/scenarios/${scenarioId}`)
  }

  async getCompleteScenario(scenarioId: string): Promise<{ scenario: ScenarioWithDialogues }> {
    return this.request<{ scenario: ScenarioWithDialogues }>(`/content/scenarios/${scenarioId}/complete`)
  }

  // Progress endpoints
  async getUserProgress(userId: string, scenarioId?: string): Promise<{ progress: UserProgress[]; total: number }> {
    const endpoint = scenarioId 
      ? `/content/progress/${userId}?scenario_id=${scenarioId}`
      : `/content/progress/${userId}`
    return this.request<{ progress: UserProgress[]; total: number }>(endpoint)
  }

  async getProgressStats(userId: string): Promise<{ stats: ProgressStats }> {
    return this.request<{ stats: ProgressStats }>(`/content/stats/progress/${userId}`)
  }

  // Session endpoints
  async createSession(sessionData: CreateSessionRequest): Promise<{ practice_session: PracticeSession }> {
    return this.request<{ practice_session: PracticeSession }>('/sessions/practice/create', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    })
  }

  async completeSession(sessionId: string, duration?: number): Promise<{ practice_session: PracticeSession }> {
    return this.request<{ practice_session: PracticeSession }>(`/sessions/practice/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ duration }),
    })
  }

  // AI endpoints
  async processConversation(data: ConversationRequest): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('/ai/conversation/process', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async generateFeedback(data: FeedbackRequest): Promise<FeedbackResponse> {
    return this.request<FeedbackResponse>('/ai/feedback/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export types and client
export type { ApiClient }
export default apiClient