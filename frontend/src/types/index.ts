/**
 * Comprehensive Type Definitions for OET Platform
 * Replaces all 'any' types with proper TypeScript definitions
 */

// Base types
export type UUID = string
export type ISODateString = string
export type EmailAddress = string

// User and Authentication Types
export interface User {
  id: UUID
  email: EmailAddress
  fullName: string
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist' | 'pharmacist' | 'veterinarian'
  role: 'admin' | 'student' | 'instructor'
  subscriptionTier: 'free' | 'premium' | 'professional'
  isActive: boolean
  createdAt: ISODateString
  lastLoginAt?: ISODateString
  preferences: UserPreferences
  progress: UserProgress
}

export interface UserPreferences {
  language: 'en' | 'es' | 'fr' | 'de'
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    practice_reminders: boolean
    progress_updates: boolean
  }
  practice_settings: {
    default_session_duration: number
    preferred_difficulty: 'beginner' | 'intermediate' | 'advanced'
    audio_feedback: boolean
    auto_advance: boolean
  }
}

export interface UserProgress {
  totalSessionsCompleted: number
  totalPracticeTime: number // in minutes
  currentStreak: number
  longestStreak: number
  averageScore: number
  lastSessionDate?: ISODateString
  skillLevels: Record<SkillArea, SkillLevel>
  achievements: Achievement[]
}

export type SkillArea = 
  | 'pronunciation'
  | 'fluency' 
  | 'vocabulary'
  | 'grammar'
  | 'communication_skills'
  | 'professional_terminology'

export interface SkillLevel {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  score: number // 0-100
  lastUpdated: ISODateString
  sessions_practiced: number
}

export interface Achievement {
  id: UUID
  type: 'streak' | 'score' | 'time' | 'completion' | 'skill'
  title: string
  description: string
  icon: string
  unlockedAt: ISODateString
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Patient Persona Types
export interface PatientPersona {
  id: UUID
  name: string
  age: number
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  background: string
  occupation?: string
  complaint: string
  medical_history: MedicalHistory
  emotional_state: EmotionalState
  communication_style: CommunicationStyle
  cultural_background?: CulturalBackground
  language_proficiency: LanguageProficiency
}

export interface MedicalHistory {
  primary_condition: string
  secondary_conditions: string[]
  medications: Medication[]
  allergies: string[]
  previous_treatments: string[]
  family_history: string[]
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  purpose: string
}

export type EmotionalState = 
  | 'calm' 
  | 'anxious' 
  | 'concerned' 
  | 'frustrated' 
  | 'scared' 
  | 'hopeful' 
  | 'confused'
  | 'angry'
  | 'depressed'

export interface CommunicationStyle {
  directness: 'very_direct' | 'direct' | 'diplomatic' | 'indirect'
  formality: 'very_formal' | 'formal' | 'casual' | 'very_casual'
  expressiveness: 'very_expressive' | 'expressive' | 'reserved' | 'very_reserved'
  pace: 'very_fast' | 'fast' | 'normal' | 'slow' | 'very_slow'
}

export interface CulturalBackground {
  ethnicity?: string
  religion?: string
  cultural_practices: string[]
  communication_preferences: string[]
  health_beliefs: string[]
}

export interface LanguageProficiency {
  native_language: string
  english_level: 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'native'
  accent?: string
  common_difficulties: string[]
}

// Scenario Types
export interface Scenario {
  id: UUID
  title: string
  description: string
  profession: User['profession']
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  category: ScenarioCategory
  tags: string[]
  learning_objectives: string[]
  patient_profile: PatientPersona
  scenario_context: ScenarioContext
  assessment_criteria: AssessmentCriteria
  created_at: ISODateString
  updated_at: ISODateString
  version: string
  is_active: boolean
}

export type ScenarioCategory = 
  | 'consultation'
  | 'examination'
  | 'treatment_explanation'
  | 'diagnosis_discussion'
  | 'medication_counseling'
  | 'discharge_planning'
  | 'emergency_response'
  | 'preventive_care'

export interface ScenarioContext {
  setting: 'clinic' | 'hospital' | 'pharmacy' | 'home_visit' | 'emergency_room' | 'surgical_unit'
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night'
  urgency: 'routine' | 'urgent' | 'emergency'
  prior_interactions: number
  additional_context: string[]
  environmental_factors: string[]
}

export interface AssessmentCriteria {
  communication_skills: AssessmentCriterion
  professional_knowledge: AssessmentCriterion
  empathy_and_rapport: AssessmentCriterion
  language_proficiency: AssessmentCriterion
  time_management: AssessmentCriterion
  problem_solving: AssessmentCriterion
}

export interface AssessmentCriterion {
  weight: number // 0-1, should sum to 1 across all criteria
  description: string
  scoring_rubric: ScoringRubric[]
}

export interface ScoringRubric {
  score_range: [number, number] // e.g., [0, 25] for 0-25%
  description: string
  indicators: string[]
}

// Session Types
export interface PracticeSession {
  id: UUID
  user_id: UUID
  scenario_id: UUID
  status: SessionStatus
  started_at: ISODateString
  completed_at?: ISODateString
  duration: number // in seconds
  conversation_data: ConversationData
  performance_metrics: PerformanceMetrics
  feedback: SessionFeedback
  technical_metadata: TechnicalMetadata
}

export type SessionStatus = 
  | 'created'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'failed'

export interface ConversationData {
  messages: ConversationMessage[]
  transcript: TranscriptEntry[]
  audio_segments: AudioSegment[]
  interaction_timeline: InteractionEvent[]
}

export interface ConversationMessage {
  id: UUID
  speaker: 'user' | 'ai_patient'
  content: string
  timestamp: ISODateString
  confidence_score?: number
  intent?: string
  sentiment?: Sentiment
  metadata: MessageMetadata
}

export interface MessageMetadata {
  audio_quality?: number
  speech_rate?: number
  pause_duration?: number
  background_noise_level?: number
  emotional_tone?: string[]
  medical_terminology_used?: string[]
}

export interface TranscriptEntry {
  id: UUID
  speaker: 'user' | 'ai_patient'
  text: string
  start_time: number // seconds from session start
  end_time: number
  confidence: number
  is_final: boolean
  corrections?: TextCorrection[]
}

export interface TextCorrection {
  original: string
  corrected: string
  reason: string
  confidence: number
}

export interface AudioSegment {
  id: UUID
  speaker: 'user' | 'ai_patient'
  start_time: number
  end_time: number
  audio_url?: string
  audio_data?: ArrayBuffer
  analysis: AudioAnalysis
}

export interface AudioAnalysis {
  volume_level: number
  clarity_score: number
  pace: number // words per minute
  pronunciation_score?: number
  emotional_markers: string[]
  pause_analysis: PauseAnalysis
}

export interface PauseAnalysis {
  total_pause_time: number
  average_pause_duration: number
  longest_pause: number
  pause_frequency: number
  inappropriate_pauses: number
}

export interface InteractionEvent {
  id: UUID
  type: InteractionEventType
  timestamp: ISODateString
  data: Record<string, unknown>
  impact_score?: number
}

export type InteractionEventType = 
  | 'session_start'
  | 'session_end'
  | 'message_sent'
  | 'message_received'
  | 'pause'
  | 'interruption'
  | 'technical_issue'
  | 'user_action'
  | 'ai_response'

export interface PerformanceMetrics {
  overall_score: number // 0-100
  skill_scores: Record<SkillArea, number>
  communication_effectiveness: number
  response_time: ResponseTimeMetrics
  language_quality: LanguageQualityMetrics
  professional_competency: number
  improvement_areas: string[]
  strengths: string[]
}

export interface ResponseTimeMetrics {
  average_response_time: number // in seconds
  fastest_response: number
  slowest_response: number
  response_consistency: number
  appropriate_pacing: number
}

export interface LanguageQualityMetrics {
  grammar_accuracy: number
  vocabulary_appropriateness: number
  pronunciation_clarity: number
  fluency_score: number
  professional_terminology_usage: number
}

export interface SessionFeedback {
  overall_feedback: string
  detailed_feedback: DetailedFeedback
  recommendations: Recommendation[]
  next_steps: string[]
  generated_at: ISODateString
}

export interface DetailedFeedback {
  strengths: FeedbackPoint[]
  areas_for_improvement: FeedbackPoint[]
  specific_moments: FeedbackMoment[]
  learning_objectives_met: string[]
  learning_objectives_missed: string[]
}

export interface FeedbackPoint {
  category: SkillArea
  description: string
  examples: string[]
  impact: 'high' | 'medium' | 'low'
  actionable_advice: string
}

export interface FeedbackMoment {
  timestamp: number // seconds from session start
  context: string
  what_happened: string
  what_could_be_improved: string
  example_response: string
  clip_reference?: string
}

export interface Recommendation {
  type: 'practice_more' | 'study_topic' | 'review_material' | 'take_course' | 'seek_help'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimated_time: number // in minutes
  resources: Resource[]
}

export interface Resource {
  type: 'video' | 'article' | 'exercise' | 'course' | 'external_link'
  title: string
  url: string
  duration?: number
  difficulty?: string
}

export interface TechnicalMetadata {
  platform: string
  browser: string
  device_type: 'desktop' | 'tablet' | 'mobile'
  connection_quality: ConnectionQuality
  audio_setup: AudioSetup
  session_recording_quality: RecordingQuality
  error_log: TechnicalError[]
}

export interface ConnectionQuality {
  average_latency: number
  packet_loss: number
  bandwidth: number
  stability_score: number
  disconnection_count: number
}

export interface AudioSetup {
  microphone_type: string
  audio_input_level: number
  noise_cancellation: boolean
  echo_cancellation: boolean
  sample_rate: number
  bit_depth: number
}

export interface RecordingQuality {
  audio_quality_score: number
  clarity_score: number
  noise_level: number
  distortion_level: number
  compression_ratio: number
}

export interface TechnicalError {
  timestamp: ISODateString
  error_type: string
  error_message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  impact_on_session: string
}

// Real-time and WebRTC Types
export interface WebRTCConfiguration {
  iceServers: RTCIceServer[]
  iceCandidatePoolSize?: number
}

export interface RTCConnectionState {
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  iceGatheringState: RTCIceGatheringState
  signalingState: RTCSignalingState
}

export interface MediaDeviceInfo {
  deviceId: string
  kind: MediaDeviceKind
  label: string
  groupId: string
}

export interface AudioConstraints {
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  sampleRate?: number
  channelCount?: number
}

export interface LiveKitConnectionInfo {
  serverUrl: string
  token: string
  roomName: string
  userName: string
  permissions: LiveKitPermissions
}

export interface LiveKitPermissions {
  canSubscribe: boolean
  canPublish: boolean
  canPublishData: boolean
  hidden?: boolean
  recorder?: boolean
}

// WebSocket Message Types
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  id: UUID
  timestamp: ISODateString
  data: T
  session_id?: UUID
}

export type WebSocketMessageType = 
  | 'session_start'
  | 'session_end'
  | 'audio_data'
  | 'transcript'
  | 'ai_response'
  | 'error'
  | 'heartbeat'
  | 'connection_status'

export interface AudioDataMessage {
  format: 'pcm' | 'wav' | 'mp3' | 'opus'
  sample_rate: number
  channels: number
  data: ArrayBuffer | string // base64 encoded
  duration: number
}

export interface TranscriptMessage {
  speaker: 'user' | 'ai_patient'
  text: string
  confidence: number
  is_final: boolean
  start_time: number
  end_time: number
}

export interface AIResponseMessage {
  response_id: UUID
  text: string
  audio_url?: string
  emotion: EmotionalState
  intent: string
  context_awareness: number
  response_time: number
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string // only in development
}

export interface ResponseMetadata {
  timestamp: ISODateString
  request_id: UUID
  processing_time: number
  rate_limit?: RateLimitInfo
  pagination?: PaginationInfo
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset_time: ISODateString
}

export interface PaginationInfo {
  page: number
  per_page: number
  total_pages: number
  total_items: number
  has_next: boolean
  has_previous: boolean
}

// Admin Dashboard Types
export interface DashboardMetrics {
  users: UserMetrics
  sessions: SessionMetrics
  system: SystemMetrics
  content: ContentMetrics
}

export interface UserMetrics {
  total_users: number
  active_users: number
  new_users_today: number
  user_retention_rate: number
  average_session_duration: number
  top_user_countries: CountryMetric[]
}

export interface CountryMetric {
  country: string
  users: number
  percentage: number
}

export interface SessionMetrics {
  total_sessions: number
  sessions_today: number
  average_session_score: number
  completion_rate: number
  popular_scenarios: ScenarioMetric[]
}

export interface ScenarioMetric {
  scenario_id: UUID
  title: string
  sessions: number
  average_score: number
  completion_rate: number
}

export interface SystemMetrics {
  uptime: number
  response_time: number
  error_rate: number
  server_load: number
  storage_usage: StorageMetric
}

export interface StorageMetric {
  used: number // in bytes
  available: number
  percentage: number
}

export interface ContentMetrics {
  total_scenarios: number
  scenarios_by_difficulty: Record<string, number>
  scenarios_by_profession: Record<string, number>
  average_scenario_rating: number
}

// Sentiment Analysis Types
export interface Sentiment {
  score: number // -1 to 1
  magnitude: number // 0 to infinity
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  confidence: number
}

// Error and Validation Types
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

export interface TypeGuardResult<T> {
  isValid: boolean
  data?: T
  errors: ValidationError[]
}

// Browser Compatibility Types
export interface BrowserCapabilities {
  webrtc: boolean
  mediaDevices: boolean
  audioContext: boolean
  speechRecognition: boolean
  notifications: boolean
  localStorage: boolean
  indexedDB: boolean
}

export interface DeviceCapabilities {
  microphone: boolean
  speakers: boolean
  camera: boolean
  bluetooth: boolean
  touchScreen: boolean
}

// Export all types for use throughout the application
export * from './common'
export * from './auth'
export * from './practice'