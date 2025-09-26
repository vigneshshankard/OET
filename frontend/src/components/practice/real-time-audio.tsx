"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useLocalParticipant, useMaybeRoomContext } from '@livekit/components-react'
import { realTimeSessionService } from '@/services/realtime-session'

interface RealTimeAudioProps {
  roomName: string
  scenarioId: string
  onTranscript: (text: string, isAI: boolean) => void
  onConversationComplete: () => void
}

export default function RealTimeAudio({
  roomName,
  scenarioId,
  onTranscript,
  onConversationComplete
}: RealTimeAudioProps) {
  const room = useMaybeRoomContext()
  const { localParticipant } = useLocalParticipant()
  
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // Audio level monitoring
  const [userAudioLevel, setUserAudioLevel] = useState(0)
  const [aiAudioLevel, setAiAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context and check LiveKit connection
  useEffect(() => {
    if (room) {
      setConnectionState('connected')
      console.log('✅ Connected to LiveKit room:', room.name)
      
      // Listen for participants
      room.on('participantConnected', (participant) => {
        console.log('👤 Participant connected:', participant.identity)
      })

      room.on('trackSubscribed', (track, publication, participant) => {
        console.log('🔊 Track subscribed:', track.kind, 'from', participant.identity)
        if (track.kind === 'audio' && participant.identity.includes('ai-patient')) {
          setIsAISpeaking(true)
          
          // Play AI audio
          if (track instanceof MediaStreamTrack) {
            const stream = new MediaStream([track])
            const audio = new Audio()
            audio.srcObject = stream
            audio.play().catch(console.error)
            
            track.addEventListener('ended', () => {
              setIsAISpeaking(false)
            })
          }
        }
      })
    }
  }, [room])

  // Process audio with real-time service
  const processAudioWithAI = async (audioBlob: Blob, transcript?: string) => {
    try {
      console.log('🎵 Processing audio with real-time service...')
      
      await realTimeSessionService.sendAudioData(audioBlob, transcript)
      
      // Trigger transcript callback if available
      if (transcript) {
        onTranscript(transcript, false)
      }
      
    } catch (error) {
      console.error('❌ Error processing audio:', error)
    }
  }

  // Setup audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
        processAudioWithAI(audioBlob)
        chunksRef.current = []
      }

      mediaRecorder.start()
      setIsUserSpeaking(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsUserSpeaking(false)
    }
  }

  // Initialize connection and setup
  useEffect(() => {
    // Simulate connection process
    setTimeout(() => {
      setConnectionState('connected')
    }, 2000)

    // Initialize real-time session
    setTimeout(() => {
      console.log('✅ AI participant ready for conversation')
    }, 3000)

    // Start simulated conversation after connection
    setTimeout(() => {
      // Trigger initial AI greeting
      onTranscript('Hello, I\'m Sarah Chen. Thank you for seeing me today, Doctor. I\'ve been having some concerns about my diabetes management.', true)
      setIsAISpeaking(true)
      
      setTimeout(() => {
        setIsAISpeaking(false)
      }, 4000)
    }, 4000)
  }, [onTranscript])

  // Audio level monitoring for visual feedback
  useEffect(() => {
    let animationFrame: number
    
    const monitorAudioLevels = () => {
      // This would connect to actual audio context for real levels
      // For now, simulate speaking detection
      if (isUserSpeaking) {
        setUserAudioLevel(Math.random() * 0.8 + 0.2)
      } else {
        setUserAudioLevel(0)
      }
      
      if (isAISpeaking) {
        setAiAudioLevel(Math.random() * 0.8 + 0.2)
      } else {
        setAiAudioLevel(0)
      }
      
      animationFrame = requestAnimationFrame(monitorAudioLevels)
    }
    
    monitorAudioLevels()
    return () => cancelAnimationFrame(animationFrame)
  }, [isUserSpeaking, isAISpeaking])

  // Simulate periodic conversation exchanges for demo
  useEffect(() => {
    if (connectionState === 'connected' && room) {
      const conversationTimer = setInterval(() => {
        // Simulate AI asking follow-up questions
        const aiQuestions = [
          "How long have you been experiencing these symptoms?",
          "Have you noticed any patterns with your blood sugar levels?",
          "Are you having any difficulty with the dietary recommendations?",
          "Do you have any concerns about your current medication?",
          "Is there anything else you'd like to discuss about your condition?"
        ]
        
        // Randomly simulate AI speaking
        if (Math.random() > 0.7 && !isAISpeaking && !isUserSpeaking) {
          const randomQuestion = aiQuestions[Math.floor(Math.random() * aiQuestions.length)]
          onTranscript(randomQuestion, true)
          setIsAISpeaking(true)
          
          setTimeout(() => {
            setIsAISpeaking(false)
          }, 3000 + Math.random() * 2000)
        }
        
        // Simulate user responses occasionally
        if (Math.random() > 0.8 && !isAISpeaking && !isUserSpeaking) {
          setIsUserSpeaking(true)
          setTimeout(() => {
            onTranscript("Thank you for asking, Doctor. I've been trying to follow the diet plan, but it's been challenging during busy work days.", false)
            setIsUserSpeaking(false)
          }, 2000 + Math.random() * 1000)
        }
      }, 5000)

      return () => clearInterval(conversationTimer)
    }
  }, [connectionState, room, isAISpeaking, isUserSpeaking, onTranscript])

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return '#22C55E'
      case 'connecting': return '#FF8C00'
      case 'disconnected': return '#EF4444'
      default: return '#36454F'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected - AI Ready'
      case 'connecting': return 'Connecting to AI...'
      case 'disconnected': return 'Connection Lost'
      default: return 'Initializing...'
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-white border border-gray-100">
        <div 
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: getConnectionStatusColor() }}
        />
        <span className="font-medium" style={{ color: '#36454F' }}>
          {getConnectionStatusText()}
        </span>
        {connectionState === 'connected' && (
          <span className="text-sm opacity-60" style={{ color: '#36454F' }}>
            • AI Assistant Online
          </span>
        )}
      </div>

      {/* Audio Visualizers */}
      <div className="grid grid-cols-2 gap-6">
        {/* User Audio */}
        <div className="text-center space-y-3">
          <div className="text-sm font-medium" style={{ color: '#36454F' }}>
            You
          </div>
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer pulse ring */}
            <div 
              className={`absolute inset-0 rounded-full ${isUserSpeaking ? 'animate-ping' : ''}`}
              style={{ 
                backgroundColor: isUserSpeaking ? '#008080' : '#E5E5E5',
                opacity: isUserSpeaking ? 0.3 : 0.1
              }}
            />
            {/* Inner audio level circle */}
            <div 
              className="absolute inset-2 rounded-full transition-all duration-100"
              style={{ 
                backgroundColor: '#008080',
                opacity: isUserSpeaking ? 0.8 : 0.3,
                transform: `scale(${0.6 + userAudioLevel * 0.4})`
              }}
            />
            {/* Center microphone icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: isUserSpeaking ? 'white' : '#36454F' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                <path d="M12 18v4"/>
                <path d="M8 22h8"/>
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-60" style={{ color: '#36454F' }}>
            {isUserSpeaking ? 'Speaking...' : 'Listening'}
          </div>
        </div>

        {/* AI Audio */}
        <div className="text-center space-y-3">
          <div className="text-sm font-medium" style={{ color: '#36454F' }}>
            AI Assistant
          </div>
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer pulse ring */}
            <div 
              className={`absolute inset-0 rounded-full ${isAISpeaking ? 'animate-ping' : ''}`}
              style={{ 
                backgroundColor: isAISpeaking ? '#FF8C00' : '#E5E5E5',
                opacity: isAISpeaking ? 0.3 : 0.1
              }}
            />
            {/* Inner audio level circle */}
            <div 
              className="absolute inset-2 rounded-full transition-all duration-100"
              style={{ 
                backgroundColor: '#FF8C00',
                opacity: isAISpeaking ? 0.8 : 0.3,
                transform: `scale(${0.6 + aiAudioLevel * 0.4})`
              }}
            />
            {/* Center AI icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8" style={{ color: isAISpeaking ? 'white' : '#36454F' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-60" style={{ color: '#36454F' }}>
            {isAISpeaking ? 'Speaking...' : 'Listening'}
          </div>
        </div>
      </div>

      {/* Debug Info (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs space-y-1 p-2 bg-gray-50 rounded opacity-60">
          <div>Room: {roomName}</div>
          <div>Participants: {room?.numParticipants || 1}</div>
          <div>AI Participant: {connectionState === 'connected' ? 'Ready' : 'Connecting'}</div>
          <div>Connection: {connectionState}</div>
        </div>
      )}
    </div>
  )
}