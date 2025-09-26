"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import RealTimeAudio from './real-time-audio'
import LiveKitProvider from './livekit-provider'
import { realTimeSessionService, type SessionData, type ConversationMessage as RTSMessage } from '@/services/realtime-session'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'

interface ConversationMessage {
  id: string
  speaker: 'user' | 'ai'
  text: string
  timestamp: Date
  confidence?: number
}

interface RealTimeConversationProps {
  scenario: {
    id: string
    title: string
    description: string
    profession: string
    difficulty: string
    duration: string
    patientProfile: {
      name: string
      age: number
      condition: string
      background: string
    }
  }
  onComplete: (transcript: ConversationMessage[]) => void
}

export default function RealTimeConversation({ scenario, onComplete }: RealTimeConversationProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'ai' | 'waiting'>('waiting')
  const [conversationPhase, setConversationPhase] = useState<'intro' | 'assessment' | 'discussion' | 'closing'>('intro')
  const [sessionStartTime] = useState(new Date())
  const [isProcessing, setIsProcessing] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'active' | 'completed' | 'error'>('connecting')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Timer for session duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [sessionStartTime])

  // Process AI conversation turn
  const processConversationTurn = async (userInput: string) => {
    try {
      setIsProcessing(true)
      
      // Process with real-time session service
      console.log('📝 Processing conversation turn:', userInput)
      
      // Send text message via real-time service
      await realTimeSessionService.sendTextMessage(userInput)
      
      // Return placeholder response (actual AI response will come via WebSocket)
      return "Processing your message..."
    } catch (error) {
      console.error('Error processing conversation turn:', error)
      return "Thank you. What else would you like to discuss?"
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle real-time transcript updates
  const handleTranscript = async (text: string, isAI: boolean) => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      speaker: isAI ? 'ai' : 'user',
      text: text,
      timestamp: new Date(),
      confidence: isAI ? 1.0 : 0.95 // AI always confident, user speech-to-text slightly less
    }

    setMessages(prev => [...prev, newMessage])
    setCurrentSpeaker(isAI ? 'ai' : 'user')

    // If user spoke, generate AI response
    if (!isAI && text.trim().length > 0) {
      const aiResponse = await processConversationTurn(text)
      
      // Add AI response after a brief delay
      setTimeout(() => {
        const aiMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          speaker: 'ai',
          text: aiResponse || "I understand. Please continue.",
          timestamp: new Date(),
          confidence: 1.0
        }
        setMessages(prev => [...prev, aiMessage])
        setCurrentSpeaker('ai')
      }, 1500) // 1.5 second delay for natural conversation flow
    }

    // Auto-advance conversation phases based on message count and content
    if (messages.length > 3 && conversationPhase === 'intro') {
      setConversationPhase('assessment')
    } else if (messages.length > 8 && conversationPhase === 'assessment') {
      setConversationPhase('discussion')
    } else if (messages.length > 12 && conversationPhase === 'discussion') {
      setConversationPhase('closing')
    }
  }

  // Handle conversation completion
  const handleConversationComplete = () => {
    onComplete(messages)
  }

  // Initialize conversation with AI greeting
  useEffect(() => {
    setTimeout(() => {
      const greeting: ConversationMessage = {
        id: 'ai-greeting',
        speaker: 'ai',
        text: `Hello, I'm ${scenario.patientProfile.name}. Thank you for seeing me today, Doctor. I've been having some concerns about my ${scenario.patientProfile.condition.toLowerCase()}.`,
        timestamp: new Date(),
        confidence: 1.0
      }
      setMessages([greeting])
      setCurrentSpeaker('ai')
    }, 2000) // Small delay for connection
  }, [scenario])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'intro': return '#008080'
      case 'assessment': return '#FF8C00'
      case 'discussion': return '#22C55E'
      case 'closing': return '#8B5CF6'
      default: return '#36454F'
    }
  }

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'intro': return 'Getting acquainted and understanding initial concerns'
      case 'assessment': return 'Gathering detailed information and symptoms'
      case 'discussion': return 'Discussing treatment options and recommendations'
      case 'closing': return 'Summarizing and providing next steps'
      default: return 'Conversation in progress'
    }
  }

  return (
    <LiveKitProvider roomName={`practice-${scenario.id}`} userName="healthcare-professional">
      <div className="space-y-6">
      {/* Session Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#36454F' }}>
            Live Conversation
          </h2>
          <p className="text-sm opacity-70" style={{ color: '#36454F' }}>
            {scenario.title}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-mono" style={{ color: '#008080' }}>
              {formatTime(elapsedTime)}
            </div>
            <div className="text-xs opacity-60" style={{ color: '#36454F' }}>
              Session Time
            </div>
          </div>
          <Button
            onClick={handleConversationComplete}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Conversation Phase Indicator */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: getPhaseColor(conversationPhase) }}
              />
              <div>
                <div className="font-medium capitalize" style={{ color: '#36454F' }}>
                  {conversationPhase} Phase
                </div>
                <div className="text-xs opacity-60" style={{ color: '#36454F' }}>
                  {getPhaseDescription(conversationPhase)}
                </div>
              </div>
            </div>
            <Badge 
              variant="outline"
              style={{
                backgroundColor: `${getPhaseColor(conversationPhase)}20`,
                color: getPhaseColor(conversationPhase),
                borderColor: getPhaseColor(conversationPhase)
              }}
            >
              {messages.length} exchanges
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Audio Component */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <RealTimeAudio
            roomName={`practice-${scenario.id}`}
            scenarioId={scenario.id}
            onTranscript={handleTranscript}
            onConversationComplete={handleConversationComplete}
          />
        </CardContent>
      </Card>

      {/* Conversation Focus Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-lg font-medium" style={{ color: '#36454F' }}>
              Focus on the conversation
            </div>
            <p className="text-sm opacity-70 max-w-md mx-auto" style={{ color: '#36454F' }}>
              Listen carefully to {scenario.patientProfile.name} and respond naturally. 
              You'll see the full transcript and detailed feedback after your session.
            </p>
            {currentSpeaker === 'ai' && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm opacity-60" style={{ color: '#36454F' }}>
                  {scenario.patientProfile.name} is speaking...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Context Card */}
      <Card className="border-0 shadow-sm bg-teal-50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>
            Patient Context
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="opacity-60">Name:</span> {scenario.patientProfile.name}
            </div>
            <div>
              <span className="opacity-60">Age:</span> {scenario.patientProfile.age}
            </div>
            <div className="col-span-2">
              <span className="opacity-60">Condition:</span> {scenario.patientProfile.condition}
            </div>
            <div className="col-span-2">
              <span className="opacity-60">Background:</span> {scenario.patientProfile.background}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </LiveKitProvider>
  )
}