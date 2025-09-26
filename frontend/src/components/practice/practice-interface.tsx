"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import AudioRecorder from "./audio-recorder"

interface PracticeInterfaceProps {
  scenario: any
  onComplete: () => void
}

type ConversationEntry = {
  id: string
  speaker: 'user' | 'ai' | 'system'
  text: string
  timestamp: Date
  audioUrl?: string
}

export default function PracticeInterface({ scenario, onComplete }: PracticeInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [currentPhase, setCurrentPhase] = useState(0)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(true)
  
  // Mock conversation phases for role-play
  const conversationPhases = [
    {
      id: 1,
      prompt: "Welcome the patient and introduce yourself. Ask about their general well-being since the last visit.",
      aiResponse: "Good morning, Doctor. Thank you for seeing me today. I've been managing okay, but I do have some concerns I'd like to discuss with you."
    },
    {
      id: 2,
      prompt: "Ask about their current medication and how they've been managing their blood sugar levels.",
      aiResponse: "I've been taking the Metformin as prescribed, twice a day. My blood sugar readings have been mostly between 7-9 mmol/L, but sometimes they spike after meals, especially during busy work days."
    },
    {
      id: 3,
      prompt: "Discuss their diet and lifestyle. Address their concerns about blood sugar spikes during work.",
      aiResponse: "You're right, doctor. During busy periods at work, I often skip meals or grab something quick and unhealthy. I know it's not good, but sometimes I don't have a choice. What can I do better?"
    },
    {
      id: 4,
      prompt: "Provide education about meal planning and discuss strategies for managing diabetes during busy periods.",
      aiResponse: "That makes sense. I hadn't thought about preparing meals in advance. Do you think I need to adjust my medication, or will these lifestyle changes be enough?"
    },
    {
      id: 5,
      prompt: "Address their medication questions and discuss the next steps including follow-up appointments and monitoring.",
      aiResponse: "Thank you so much, Doctor. This has been very helpful. I feel more confident about managing my condition now. When should I come back for the next check-up?"
    }
  ]

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isSessionActive) {
      timer = setInterval(() => {
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isSessionActive])

  // Initialize session
  useEffect(() => {
    setConversation([
      {
        id: '1',
        speaker: 'system',
        text: `Welcome to your practice session. You are about to role-play as a ${scenario.profession.toLowerCase()} with ${scenario.patientBackground.name}. The patient is here for a follow-up consultation. Begin when you're ready.`,
        timestamp: new Date()
      }
    ])
  }, [scenario])

  const handleRecordingComplete = (audioBlob: Blob) => {
    // Add user's response to conversation
    const userEntry: ConversationEntry = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: '[Your spoken response - transcription would appear here in full version]',
      timestamp: new Date(),
      audioUrl: URL.createObjectURL(audioBlob)
    }

    setConversation(prev => [...prev, userEntry])

    // Simulate AI processing and response
    setTimeout(() => {
      if (currentPhase < conversationPhases.length) {
        const aiEntry: ConversationEntry = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: conversationPhases[currentPhase].aiResponse,
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, aiEntry])
        setCurrentPhase(prev => prev + 1)
        
        // Check if session is complete
        if (currentPhase + 1 >= conversationPhases.length) {
          setTimeout(() => {
            setIsSessionActive(false)
            onComplete()
          }, 2000)
        }
      }
    }, 2000)
  }

  const getCurrentPrompt = () => {
    if (currentPhase < conversationPhases.length) {
      return conversationPhases[currentPhase].prompt
    }
    return "Session completed. Thank the patient and provide a summary of the consultation."
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (currentPhase / conversationPhases.length) * 100

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Session Info */}
          <div className="space-y-6">
            {/* Session Progress */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between" style={{ color: '#36454F' }}>
                  <span>Session Progress</span>
                  <span className="text-sm font-mono" style={{ color: '#008080' }}>
                    {formatTime(sessionTimer)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-sm" style={{ color: '#36454F' }}>
                    <span>Phase {currentPhase + 1} of {conversationPhases.length}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Objective */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ color: '#36454F' }}>
                  Current Objective
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed" style={{ color: '#36454F' }}>
                  {getCurrentPrompt()}
                </p>
              </CardContent>
            </Card>

            {/* Patient Info Quick Reference */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ color: '#36454F' }}>
                  Patient Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium" style={{ color: '#36454F' }}>Name:</span>
                    <span className="ml-2" style={{ color: '#36454F' }}>{scenario.patientBackground.name}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#36454F' }}>Age:</span>
                    <span className="ml-2" style={{ color: '#36454F' }}>{scenario.patientBackground.age}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#36454F' }}>Occupation:</span>
                    <span className="ml-2" style={{ color: '#36454F' }}>{scenario.patientBackground.occupation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Main Practice Area */}
          <div className="space-y-6">
            {/* Audio Interface */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSessionActive(false)
                  onComplete()
                }}
                style={{ borderColor: '#EF4444', color: '#EF4444' }}
              >
                End Session
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Conversation History */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ color: '#36454F' }}>
                  Conversation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg text-sm ${
                        entry.speaker === 'user'
                          ? 'bg-teal-50 border border-teal-100'
                          : entry.speaker === 'ai'
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-medium text-xs"
                          style={{
                            color:
                              entry.speaker === 'user'
                                ? '#008080'
                                : entry.speaker === 'ai'
                                ? '#3B82F6'
                                : '#6B7280'
                          }}
                        >
                          {entry.speaker === 'user'
                            ? 'You'
                            : entry.speaker === 'ai'
                            ? scenario.patientBackground.name
                            : 'System'}
                        </span>
                        <span className="text-xs opacity-60">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ color: '#36454F' }}>{entry.text}</p>
                      {entry.audioUrl && (
                        <audio controls className="mt-2 w-full">
                          <source src={entry.audioUrl} type="audio/wav" />
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}