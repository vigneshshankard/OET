/**
 * OET Praxis API Client
 * Real implementation connecting to backend gateway at localhost:8000
 */

import { config } from '@/config/app'
import { PatientPersona, EmotionalState, SkillArea } from '@/types/practice'

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
  patient_persona: PatientPersona
  clinical_area: string
  difficulty_level: string
  profession: string
  status: string
  created_at: string
  duration?: number
}

export interface Dialogue {
  id: string
  scenario_id: string
  speaker: 'user' | 'patient'
  message: string
  expected_response?: string
  order_number: number
  metadata: DialogueMetadata
}

export interface DialogueMetadata {
  emotional_tone?: EmotionalState
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  medical_terminology?: string[]
  context_hints?: string[]
  expected_response_type?: 'question' | 'explanation' | 'empathy' | 'instruction'
  time_limit?: number
  scoring_weight?: number
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
  metadata?: SessionMetadata
}

export interface SessionMetadata {
  user_preferences?: UserSessionPreferences
  device_info?: DeviceInfo
  connection_quality?: ConnectionQuality
  practice_goals?: string[]
  time_limit?: number
}

export interface UserSessionPreferences {
  audio_feedback: boolean
  difficulty_adjustment: boolean
  hints_enabled: boolean
  pace_preference: 'slow' | 'normal' | 'fast'
}

export interface DeviceInfo {
  platform: string
  browser: string
  device_type: 'desktop' | 'tablet' | 'mobile'
  screen_resolution?: string
  audio_devices?: MediaDeviceInfo[]
}

export interface ConnectionQuality {
  bandwidth: number
  latency: number
  packet_loss: number
  stability_score: number
}

export interface PracticeSession {
  id: string
  user_id: string
  scenario_id: string
  status: 'created' | 'in_progress' | 'paused' | 'completed' | 'abandoned' | 'failed'
  livekit_room_name: string
  livekit_token?: string
  start_time: string
  end_time?: string
  duration?: number
  metadata?: SessionMetadata
}

export interface ConversationRequest {
  session_id: string
  user_audio: string
  context: ConversationContext
}

export interface ConversationContext {
  current_dialogue_id?: string
  previous_messages: ConversationMessage[]
  patient_state: PatientState
  session_progress: SessionProgress
  user_performance: UserPerformanceSnapshot
}

export interface ConversationMessage {
  id: string
  speaker: 'user' | 'patient'
  content: string
  timestamp: string
  confidence_score?: number
  intent?: string
  sentiment?: SentimentAnalysis
}

export interface PatientState {
  current_emotion: EmotionalState
  pain_level?: number
  understanding_level: number
  cooperation_level: number
  trust_level: number
}

export interface SessionProgress {
  phase: 'introduction' | 'assessment' | 'discussion' | 'conclusion'
  completion_percentage: number
  key_points_covered: string[]
  remaining_objectives: string[]
}

export interface UserPerformanceSnapshot {
  current_score: number
  skill_demonstrations: Record<SkillArea, number>
  response_quality: number
  empathy_shown: number
  professional_language_use: number
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  magnitude: number
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  confidence: number
}

export interface ConversationResponse {
  response_text: string
  audio_url?: string
  confidence: number
  feedback?: InstantFeedback
}

export interface InstantFeedback {
  appropriateness_score: number
  empathy_score: number
  clarity_score: number
  professional_language_score: number
  suggestions: FeedbackSuggestion[]
  positive_aspects: string[]
}

export interface FeedbackSuggestion {
  category: SkillArea
  suggestion: string
  example?: string
  priority: 'high' | 'medium' | 'low'
}

export interface FeedbackRequest {
  session_id: string
  conversation_data: ConversationData
  criteria: AssessmentCriteria[]
}

export interface ConversationData {
  messages: ConversationMessage[]
  transcript: TranscriptEntry[]
  audio_segments: AudioSegment[]
  session_summary: SessionSummary
}

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'patient'
  text: string
  start_time: number
  end_time: number
  confidence: number
  is_final: boolean
}

export interface AudioSegment {
  id: string
  speaker: 'user' | 'patient'
  start_time: number
  end_time: number
  audio_url?: string
  quality_metrics: AudioQualityMetrics
}

export interface AudioQualityMetrics {
  clarity_score: number
  volume_level: number
  background_noise: number
  speech_rate: number
  pause_analysis: PauseMetrics
}

export interface PauseMetrics {
  total_pause_time: number
  average_pause_duration: number
  inappropriate_pauses: number
  natural_flow_score: number
}

export interface SessionSummary {
  total_duration: number
  word_count: number
  turn_count: number
  average_response_time: number
  engagement_score: number
  completion_status: 'completed' | 'partial' | 'abandoned'
}

export type AssessmentCriteria = 
  | 'communication_skills'
  | 'empathy_and_rapport'
  | 'professional_knowledge'
  | 'language_proficiency'
  | 'problem_solving'
  | 'time_management'

export interface FeedbackResponse {
  overall_score: number
  detailed_feedback: DetailedFeedback
  areas_for_improvement: ImprovementArea[]
  strengths: StrengthArea[]
}

export interface DetailedFeedback {
  criteria_scores: Record<AssessmentCriteria, CriteriaScore>
  performance_highlights: PerformanceHighlight[]
  improvement_recommendations: Recommendation[]
  next_practice_suggestions: PracticeSuggestion[]
}

export interface CriteriaScore {
  score: number // 0-100
  description: string
  evidence: string[]
  improvement_tips: string[]
}

export interface PerformanceHighlight {
  timestamp: number
  category: SkillArea
  description: string
  example_text: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface Recommendation {
  type: 'practice_more' | 'study_topic' | 'review_material' | 'technique_focus'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimated_time: number
  resources: LearningResource[]
}

export interface LearningResource {
  type: 'video' | 'article' | 'exercise' | 'quiz' | 'scenario'
  title: string
  url?: string
  description: string
  duration?: number
}

export interface PracticeSuggestion {
  scenario_type: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  focus_areas: SkillArea[]
  estimated_improvement: number
}

export interface ImprovementArea {
  skill: SkillArea
  current_level: number
  target_level: number
  specific_actions: string[]
  timeline: string
}

export interface StrengthArea {
  skill: SkillArea
  score: number
  description: string
  examples: string[]
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