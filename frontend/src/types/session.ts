// Practice scenario types
export interface Scenario {
  id: string
  title: string
  description: string
  targetProfession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  clinicalArea: string
  duration: number
  patientPersona: PatientPersona
  learningObjectives: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: string
}

export interface PatientPersona {
  age: number
  gender: 'male' | 'female' | 'other'
  name: string
  background: string
  mainComplaint: string
  medicalHistory: string
  emotionalState: string
  communicationStyle: string
}

// Practice session types
export interface PracticeSession {
  id: string
  scenarioId: string
  userId: string
  status: 'active' | 'completed' | 'abandoned'
  startedAt: string
  completedAt?: string
  transcript: string
  feedback?: SessionFeedback
  overallScore?: number
}

export interface SessionFeedback {
  id: string
  sessionId: string
  overallScore: number
  summary: string
  strengths: string[]
  improvements: string[]
  detailedScores: DetailedScores
  createdAt: string
}

export interface DetailedScores {
  grammar: number
  pronunciation: number
  clinicalCommunication: number
  empathy: number
  vocabulary: number
  patientEducation: number
}