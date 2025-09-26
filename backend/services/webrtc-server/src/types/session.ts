export interface PracticeSession {
  id: string;
  userId: string;
  scenarioId: string;
  status: SessionStatus;
  livekitRoomName: string;
  livekitToken?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'error';

export interface SessionMessage {
  sessionId: string;
  type: MessageType;
  data: any;
  timestamp: Date;
  userId: string;
  sequence: number;
}

export type MessageType = 
  | 'audio' 
  | 'response' 
  | 'audio_quality' 
  | 'tts_chunk' 
  | 'session_start'
  | 'session_end'
  | 'error';

export interface AudioChunk {
  type: 'audio';
  data: string; // base64-encoded audio
  timestamp?: number;
  sequence?: number;
}

export interface AIResponse {
  type: 'response';
  text: string;
  timestamp: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AudioQuality {
  type: 'audio_quality';
  status: 'good' | 'poor' | 'silent';
  confidence: number;
  timestamp: number;
}

export interface TTSChunk {
  type: 'tts_chunk';
  data: string; // base64-encoded audio chunk
  sequence: number;
  timestamp: number;
  final?: boolean;
}

export interface SessionError {
  type: 'error';
  code: string;
  message: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface LiveKitRoom {
  name: string;
  sid: string;
  participants: LiveKitParticipant[];
  metadata?: string;
  createdAt: Date;
}

export interface LiveKitParticipant {
  identity: string;
  name: string;
  sid: string;
  metadata?: string;
  tracks: LiveKitTrack[];
  connectionQuality: 'excellent' | 'good' | 'poor';
}

export interface LiveKitTrack {
  sid: string;
  name: string;
  type: 'audio' | 'video' | 'data';
  source: 'camera' | 'microphone' | 'screen_share' | 'unknown';
  muted: boolean;
}

export interface CreateSessionRequest {
  scenarioId: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  websocketUrl: string;
  livekitUrl: string;
  livekitToken: string;
  scenario: {
    id: string;
    title: string;
    instructions: string;
  };
}

export interface SessionWebSocketEvent {
  type: string;
  data: any;
  sessionId: string;
  userId: string;
}

export interface AudioProcessingConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bufferSize: number;
  vadThreshold: number;
}

export interface TTSConfig {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  format: 'wav' | 'mp3' | 'ogg';
}

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  responseTimeout: number;
}

export interface SessionAnalytics {
  sessionId: string;
  audioQualityScore: number;
  averageLatency: number;
  totalSpeakingTime: number;
  silenceRatio: number;
  interruptionCount: number;
  responseAccuracy: number;
  technicalIssues: string[];
  createdAt: Date;
}

export interface AudioMetrics {
  volume: number;
  frequency: number;
  clarity: number;
  backgroundNoise: number;
  timestamp: Date;
}

export interface ConnectionMetrics {
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  timestamp: Date;
}

export interface WebRTCStats {
  sessionId: string;
  connectionId: string;
  audioMetrics: AudioMetrics[];
  connectionMetrics: ConnectionMetrics[];
  totalDuration: number;
  averageQuality: number;
}