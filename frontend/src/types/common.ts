// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
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

export interface ApiError {
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