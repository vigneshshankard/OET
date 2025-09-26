// API response types
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
  timestamp: string
  request_id: string
  processing_time: number
  rate_limit?: RateLimitInfo
  pagination?: PaginationInfo
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset_time: string
}

export interface PaginationInfo {
  page: number
  per_page: number
  total_pages: number
  total_items: number
  has_next: boolean
  has_previous: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ValidationError {
  message: string
  code?: string
  field?: string
}

// Common utility types
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ChartDataPoint {
  date: string
  score: number
  sessionId?: string
}

export interface SkillRadarData {
  skill: string
  level: number
  maxLevel: number
}

export interface PracticeFrequencyData {
  week: string
  sessions: number
  totalTime: number
}

export type ProfessionType = 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
export type DifficultyType = 'beginner' | 'intermediate' | 'advanced'
export type SubscriptionPlan = 'free' | 'monthly' | 'annual'