/**
 * WebRTC and Browser Compatibility Types
 * Provides type safety for WebRTC operations and browser API compatibility
 */

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

export interface WebRTCSupport {
  peerConnection: boolean
  getUserMedia: boolean
  mediaRecorder: boolean
  audioWorklet: boolean
  rtcDataChannel: boolean
  rtcStatsReport: boolean
}

// Extended Window Interface for Browser Compatibility
export interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext
  mozAudioContext?: typeof AudioContext
  webkitSpeechRecognition?: unknown
  mozSpeechRecognition?: unknown
  msSpeechRecognition?: unknown
  webkitRTCPeerConnection?: typeof RTCPeerConnection
  mozRTCPeerConnection?: typeof RTCPeerConnection
  msRTCPeerConnection?: typeof RTCPeerConnection
}

// AudioContext Types with Browser Compatibility
export interface CompatibleAudioContext {
  context: AudioContext
  isWebKit: boolean
  isMoz: boolean
  createAnalyser(): AnalyserNode
  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode
  createGain(): GainNode
  close(): Promise<void>
  resume(): Promise<void>
  suspend(): Promise<void>
}

// Media Device Types
export interface ExtendedMediaDeviceInfo extends MediaDeviceInfo {
  capabilities?: MediaTrackCapabilities
  settings?: MediaTrackSettings
  constraints?: MediaTrackConstraints
}

export interface AudioDeviceCapabilities {
  echoCancellation?: boolean[]
  noiseSuppression?: boolean[]
  autoGainControl?: boolean[]
  sampleRate?: ConstrainULongRange
  channelCount?: ConstrainULongRange
  latency?: ConstrainDoubleRange
  sampleSize?: ConstrainULongRange
}

// Enhanced MediaStream Types
export interface ExtendedMediaStreamTrack {
  track: MediaStreamTrack
  getCapabilities?(): Record<string, unknown>
  getConstraints?(): Record<string, unknown>
  getSettings?(): Record<string, unknown>
  applyConstraints?(constraints?: Record<string, unknown>): Promise<void>
}

// WebRTC Connection Types
export interface RTCConnectionConfig {
  iceServers: RTCIceServer[]
  iceCandidatePoolSize?: number
  bundlePolicy?: RTCBundlePolicy
  iceTransportPolicy?: RTCIceTransportPolicy
  rtcpMuxPolicy?: RTCRtcpMuxPolicy
}

export interface RTCConnectionState {
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  iceGatheringState: RTCIceGatheringState
  signalingState: RTCSignalingState
}

export interface RTCStatsReport {
  timestamp: number
  type: RTCStatsType
  id: string
  [key: string]: unknown
}

// Audio Analysis Types
export interface AudioAnalysisData {
  frequencyData: Uint8Array
  timeData: Uint8Array
  volume: number
  pitch?: number
  clarity: number
  backgroundNoise: number
}

export interface VoiceActivityDetection {
  isVoiceActive: boolean
  confidence: number
  voiceStartTime?: number
  voiceEndTime?: number
  silenceDuration: number
}

export interface AudioQualityMetrics {
  signalToNoiseRatio: number
  clarity: number
  volume: number
  distortion: number
  echoLevel: number
  backgroundNoise: number
}

// Speech Recognition Types with Browser Compatibility
export interface CompatibleSpeechRecognition {
  recognition: unknown
  isWebKit: boolean
  isMoz: boolean
  isMS: boolean
  start(): void
  stop(): void
  abort(): void
  addEventListener(
    type: string,
    listener: (event: unknown) => void,
    options?: boolean | AddEventListenerOptions
  ): void
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives: SpeechRecognitionAlternative[]
  timestamp: number
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

// LiveKit Enhanced Types
export interface LiveKitConnectionInfo {
  serverUrl: string
  token: string
  roomName: string
  userName: string
  permissions: LiveKitPermissions
  metadata?: LiveKitMetadata
}

export interface LiveKitPermissions {
  canSubscribe: boolean
  canPublish: boolean
  canPublishData: boolean
  canUpdateMetadata: boolean
  hidden?: boolean
  recorder?: boolean
}

export interface LiveKitMetadata {
  userId: string
  sessionId: string
  role: 'participant' | 'instructor' | 'observer'
  capabilities: string[]
  preferences: Record<string, unknown>
}

export interface LiveKitAudioSettings {
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  sampleRate: number
  channelCount: number
  bitrate: number
}

export interface LiveKitConnectionError {
  code: number
  message: string
  type: 'connection' | 'permission' | 'media' | 'server' | 'unknown'
  recoverable: boolean
}

// WebSocket Message Types for Real-time Communication
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  id: string
  timestamp: string
  sessionId?: string
  data: T
}

export type WebSocketMessageType = 
  | 'session_start'
  | 'session_end'
  | 'audio_data'
  | 'transcript'
  | 'ai_response'
  | 'heart_beat'
  | 'error'
  | 'connection_status'
  | 'user_action'
  | 'ai_greeting'
  | 'transcription'
  | 'tts_chunk'
  | 'session_started'
  | 'session_joined'
  | 'audio_quality'
  | 'pong'

export interface AudioDataMessage {
  format: 'pcm' | 'wav' | 'mp3' | 'opus' | 'webm'
  sampleRate: number
  channels: number
  bitDepth: number
  data: ArrayBuffer | string // ArrayBuffer for binary, base64 string for text transport
  duration: number
  timestamp: number
}

export interface TranscriptMessage {
  speaker: 'user' | 'ai_patient'
  text: string
  confidence: number
  isFinal: boolean
  startTime: number
  endTime: number
  alternatives?: SpeechRecognitionAlternative[]
}

export interface AIResponseMessage {
  responseId: string
  text: string
  audioUrl?: string
  emotion: string
  intent: string
  contextAwareness: number
  responseTime: number
  metadata: AIResponseMetadata
}

export interface AIResponseMetadata {
  modelVersion: string
  processingTime: number
  confidenceScore: number
  emotionalAnalysis: EmotionalAnalysis
  intentClassification: IntentClassification
}

// Specific Message Data Types
export interface AIGreetingData {
  text: string
  confidence: number
}

export interface TranscriptionData {
  text: string
  confidence: number
}

export interface TTSChunkData {
  data: string
}

export interface AudioQualityData {
  status: string
}

export interface ErrorData {
  message: string
}

export interface SessionStartedData {
  sessionId: string
  timestamp: string
}

export interface SessionJoinedData {
  participantId: string
  timestamp: string
}

export interface EmotionalAnalysis {
  primaryEmotion: string
  intensity: number
  secondaryEmotions: string[]
  appropriateness: number
}

export interface IntentClassification {
  primaryIntent: string
  confidence: number
  alternativeIntents: Array<{
    intent: string
    confidence: number
  }>
}

// Connection Status Types
export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed'
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  latency: number
  bandwidth: number
  packetLoss: number
  lastConnected?: string
  errorCount: number
}

export interface NetworkConditions {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown'
  downlink: number
  rtt: number
  saveData: boolean
}

// Error Types for WebRTC Operations
export interface WebRTCError {
  name: string
  message: string
  constraint?: string
  type: 'OverconstrainedError' | 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'SecurityError' | 'TypeError' | 'UnknownError'
  recoverable: boolean
}

export interface MediaError extends Error {
  constraint?: string
  deviceId?: string
  deviceKind?: MediaDeviceKind
  recoverySuggestions: string[]
}

// Type Guards for Runtime Type Checking
export const isExtendedWindow = (win: Window): win is ExtendedWindow => {
  return typeof win === 'object' && win !== null
}

export const isWebRTCSupported = (): boolean => {
  return !!(
    window.RTCPeerConnection ||
    (window as ExtendedWindow).webkitRTCPeerConnection ||
    (window as ExtendedWindow).mozRTCPeerConnection ||
    (window as ExtendedWindow).msRTCPeerConnection
  )
}

export const isMediaDevicesSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export const isAudioContextSupported = (): boolean => {
  return !!(
    window.AudioContext ||
    (window as ExtendedWindow).webkitAudioContext ||
    (window as ExtendedWindow).mozAudioContext
  )
}

export const isSpeechRecognitionSupported = (): boolean => {
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as ExtendedWindow).webkitSpeechRecognition ||
    (window as ExtendedWindow).mozSpeechRecognition ||
    (window as ExtendedWindow).msSpeechRecognition
  )
}

// Utility Functions for Browser Compatibility
export const getCompatibleAudioContext = (): AudioContext | null => {
  const AudioContextConstructor = 
    window.AudioContext ||
    (window as ExtendedWindow).webkitAudioContext ||
    (window as ExtendedWindow).mozAudioContext

  return AudioContextConstructor ? new AudioContextConstructor() : null
}

export const getCompatibleSpeechRecognition = (): unknown => {
  const SpeechRecognitionConstructor = 
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as ExtendedWindow).webkitSpeechRecognition ||
    (window as ExtendedWindow).mozSpeechRecognition ||
    (window as ExtendedWindow).msSpeechRecognition

  return SpeechRecognitionConstructor ? new (SpeechRecognitionConstructor as new () => unknown)() : null
}

export const getCompatibleRTCPeerConnection = (config?: RTCConfiguration): RTCPeerConnection | null => {
  const RTCPeerConnectionConstructor = 
    window.RTCPeerConnection ||
    (window as ExtendedWindow).webkitRTCPeerConnection ||
    (window as ExtendedWindow).mozRTCPeerConnection ||
    (window as ExtendedWindow).msRTCPeerConnection

  return RTCPeerConnectionConstructor ? new RTCPeerConnectionConstructor(config) : null
}

// Device Capability Detection
export const detectBrowserCapabilities = async (): Promise<BrowserCapabilities> => {
  return {
    webrtc: isWebRTCSupported(),
    mediaDevices: isMediaDevicesSupported(),
    audioContext: isAudioContextSupported(),
    speechRecognition: isSpeechRecognitionSupported(),
    notifications: 'Notification' in window,
    localStorage: 'localStorage' in window,
    indexedDB: 'indexedDB' in window
  }
}

export const detectWebRTCSupport = (): WebRTCSupport => {
  return {
    peerConnection: isWebRTCSupported(),
    getUserMedia: isMediaDevicesSupported(),
    mediaRecorder: 'MediaRecorder' in window,
    audioWorklet: !!(AudioContext.prototype.audioWorklet),
    rtcDataChannel: 'RTCDataChannel' in window,
    rtcStatsReport: 'RTCStatsReport' in window
  }
}

// Type aliases for common WebRTC types
export type WebRTCStatsType = string
export type WebRTCMediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput'
export type WebRTCConstraintRange = { min?: number; max?: number; exact?: number; ideal?: number }