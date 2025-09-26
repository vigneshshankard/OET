// Feedback and scoring types from database-schema.md
export interface FeedbackReport {
  id: string;
  sessionId: string;
  transcript: string;
  aiSummary: string;
  scoreRaw: number;
  strengths: string;
  areasForImprovement: string;
  createdAt: Date;
}

export interface ScoreBreakdown {
  overall: number;
  fluency: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  clinicalCommunication: number;
  empathy: number;
  structure: number;
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'patient';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface AIFeedbackRequest {
  transcript: string;
  scenarioId: string;
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
}

export interface AIFeedbackResponse {
  summary: string;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  areasForImprovement: string[];
  specificSuggestions: string[];
  exampleResponses: string[];
}