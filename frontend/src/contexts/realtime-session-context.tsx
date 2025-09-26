import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Types
export type SessionState = 'idle' | 'active' | 'paused' | 'completed'
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
export type AudioState = 'inactive' | 'recording' | 'paused'

export interface Message {
  id: string
  speaker: 'user' | 'patient' | 'system'
  content: string
  timestamp: Date
}

export interface RealtimeSessionState {
  sessionState: SessionState
  connectionState: ConnectionState
  audioState: AudioState
  sessionId: string | null
  scenarioId: string | null
  messages: Message[]
  error: string | null
  loading: boolean
}

export interface RealtimeSessionContextType extends RealtimeSessionState {
  startSession: (scenarioId: string, userId: string) => Promise<void>
  endSession: () => Promise<void>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  toggleMicrophone: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
}

// Initial state
const initialState: RealtimeSessionState = {
  sessionState: 'idle',
  connectionState: 'disconnected',
  audioState: 'inactive',
  sessionId: null,
  scenarioId: null,
  messages: [],
  error: null,
  loading: false,
}

// Action types
type RealtimeSessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_STATE'; payload: SessionState }
  | { type: 'SET_CONNECTION_STATE'; payload: ConnectionState }
  | { type: 'SET_AUDIO_STATE'; payload: AudioState }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_SCENARIO_ID'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET_SESSION' }

// Reducer
function realtimeSessionReducer(
  state: RealtimeSessionState,
  action: RealtimeSessionAction
): RealtimeSessionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_SESSION_STATE':
      return { ...state, sessionState: action.payload }
    case 'SET_CONNECTION_STATE':
      return { ...state, connectionState: action.payload }
    case 'SET_AUDIO_STATE':
      return { ...state, audioState: action.payload }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }
    case 'SET_SCENARIO_ID':
      return { ...state, scenarioId: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }
    case 'RESET_SESSION':
      return {
        ...initialState,
        messages: [], // Keep messages cleared
      }
    default:
      return state
  }
}

// Context
const RealtimeSessionContext = createContext<RealtimeSessionContextType | undefined>(undefined)

// Provider component
export function RealtimeSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(realtimeSessionReducer, initialState)

  // Mock implementation for testing
  const startSession = async (scenarioId: string, userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Mock session creation
      await new Promise(resolve => setTimeout(resolve, 100))
      
      dispatch({ type: 'SET_SCENARIO_ID', payload: scenarioId })
      dispatch({ type: 'SET_SESSION_ID', payload: `session-${Date.now()}` })
      dispatch({ type: 'SET_SESSION_STATE', payload: 'active' })
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'connecting' })
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const endSession = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Mock session completion
      await new Promise(resolve => setTimeout(resolve, 100))
      
      dispatch({ type: 'SET_SESSION_STATE', payload: 'idle' })
      dispatch({ type: 'SET_CONNECTION_STATE', payload: 'disconnected' })
      dispatch({ type: 'SET_AUDIO_STATE', payload: 'inactive' })
      dispatch({ type: 'RESET_SESSION' })
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const pauseSession = async () => {
    dispatch({ type: 'SET_SESSION_STATE', payload: 'paused' })
    dispatch({ type: 'SET_AUDIO_STATE', payload: 'paused' })
  }

  const resumeSession = async () => {
    dispatch({ type: 'SET_SESSION_STATE', payload: 'active' })
    dispatch({ type: 'SET_AUDIO_STATE', payload: 'recording' })
  }

  const toggleMicrophone = async () => {
    try {
      if (state.audioState === 'inactive') {
        dispatch({ type: 'SET_AUDIO_STATE', payload: 'recording' })
      } else {
        dispatch({ type: 'SET_AUDIO_STATE', payload: 'inactive' })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Audio error' })
    }
  }

  const sendMessage = async (content: string) => {
    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        speaker: 'user',
        content,
        timestamp: new Date(),
      }
      
      dispatch({ type: 'ADD_MESSAGE', payload: message })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Message error' })
    }
  }

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  const contextValue: RealtimeSessionContextType = {
    ...state,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    toggleMicrophone,
    sendMessage,
    clearError,
  }

  return (
    <RealtimeSessionContext.Provider value={contextValue}>
      {children}
    </RealtimeSessionContext.Provider>
  )
}

// Hook to use the context
export function useRealtimeSession() {
  const context = useContext(RealtimeSessionContext)
  if (context === undefined) {
    throw new Error('useRealtimeSession must be used within a RealtimeSessionProvider')
  }
  return context
}