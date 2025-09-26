export interface TranscriptEntry {
  text: string
  timestamp: number
  speaker: 'user' | 'patient'
  confidence?: number
}

export interface SessionData {
  sessionId: string
  startTime: number
  transcript?: TranscriptEntry[]
  duration?: number
  feedback?: AIFeedbackResponse
  wsUrl?: string
  token?: string
  room?: string
  websocketUrl?: string
  livekitToken?: string
  livekitUrl?: string
  completedPhases?: number
  totalPhases?: number
}

export interface SessionCreateRequest {
  scenarioId: string
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist' | 'pharmacist' | 'veterinarian'
  patientPersona: PatientPersona
}

export interface PatientPersona {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  background: string
  occupation?: string
  complaint: string
  medicalHistory: MedicalHistory
  emotionalState: EmotionalState
  communicationStyle: CommunicationStyle
  culturalBackground?: CulturalBackground
  languageProficiency: LanguageProficiency
}

export interface MedicalHistory {
  primaryCondition: string
  secondaryConditions: string[]
  medications: Medication[]
  allergies: string[]
  previousTreatments: string[]
  familyHistory: string[]
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
  culturalPractices: string[]
  communicationPreferences: string[]
  healthBeliefs: string[]
}

export interface LanguageProficiency {
  nativeLanguage: string
  englishLevel: 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'native'
  accent?: string
  commonDifficulties: string[]
}

export type SkillArea = 
  | 'pronunciation'
  | 'fluency' 
  | 'vocabulary'
  | 'grammar'
  | 'communication_skills'
  | 'professional_terminology'

export interface SessionCreateResponse {
  sessionId: string
  token: string
  url: string
  room: string
  wsUrl: string
}

export type SessionState = 'loading' | 'ready' | 'active' | 'feedback' | 'error'

export interface AIFeedbackRequest {
  transcript: string
  patientPersona: string
  sessionDuration: number
  targetProfession: string
  difficultyLevel: string
  scenarioType: string
}

export interface AIFeedbackResponse {
  overallScore: number
  detailedScores: {
    pronunciation: number
    grammar: number
    vocabulary: number
    clinicalCommunication: number
    empathy: number
    patientEducation: number
  }
  strengths: string[]
  improvements: string[]
}