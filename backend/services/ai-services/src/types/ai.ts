export interface AudioProcessingRequest {
  audioData: Buffer;
  format?: 'wav' | 'mp3' | 'webm';
  language?: string;
  sessionId: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language?: string;
  processingTime: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  sessionId: string;
}

export interface TTSResult {
  audioData: Buffer;
  format: 'wav' | 'mp3';
  duration: number;
  processingTime: number;
}

export interface LLMRequest {
  message: string;
  context?: string[];
  sessionId: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  response: string;
  confidence: number;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

export interface ConversationAnalysis {
  sessionId: string;
  transcript: string;
  analysis: {
    fluency: number;
    pronunciation: number;
    vocabulary: number;
    grammar: number;
    overall: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  mistakes: Array<{
    type: 'pronunciation' | 'grammar' | 'vocabulary';
    text: string;
    correction: string;
    explanation: string;
  }>;
}

export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}