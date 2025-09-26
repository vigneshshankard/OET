"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import RealTimeConversation from "./real-time-conversation"
import FeedbackReport from "./feedback-report"
import { useRouter } from "next/navigation"
import apiClient, { type ScenarioWithDialogues, type PracticeSession } from "@/lib/api-client"

interface PracticeScenarioProps {
  scenarioId: string
}

export default function PracticeScenario({ scenarioId }: PracticeScenarioProps) {
  const [scenario, setScenario] = useState<ScenarioWithDialogues | null>(null)
  const [sessionState, setSessionState] = useState<'preview' | 'active' | 'feedback'>('preview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null)
  const [sessionData, setSessionData] = useState<{
    duration: number
    completedPhases: number
    totalPhases: number
    startTime: number
    transcript?: any[]
  }>({
    duration: 0,
    completedPhases: 0,
    totalPhases: 5,
    startTime: 0,
    transcript: []
  })
  const router = useRouter()

  useEffect(() => {
    fetchScenario()
  }, [scenarioId])

  const fetchScenario = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.getCompleteScenario(scenarioId)
      setScenario(response.scenario)
      
    } catch (err) {
      console.error('Failed to fetch scenario:', err)
      setError('Failed to load practice scenario. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startSession = async () => {
    try {
      if (!scenario) return
      
      // TODO: Get current user ID from auth context
      const userId = 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' // Using admin user for testing
      
      // Create a practice session
      const sessionResponse = await apiClient.createSession({
        user_id: userId,
        scenario_id: scenario.id,
        livekit_room_name: `practice_${scenario.id}_${Date.now()}`,
        metadata: { scenario_title: scenario.title }
      })
      
      setPracticeSession(sessionResponse.practice_session)
      setSessionState('active')
      setSessionData(prev => ({ ...prev, startTime: Date.now() }))
      
    } catch (err) {
      console.error('Failed to start session:', err)
      setError('Failed to start practice session. Please try again.')
    }
  }

  // FALLBACK MOCK DATA for development
  const mockScenarios = {
      "diabetes-consultation": {
        id: "diabetes-consultation",
        title: "Patient Consultation - Diabetes Management",
        profession: "Doctor",
        difficulty: "Intermediate",
        duration: "8-12 minutes",
        description: "Conduct a follow-up consultation with a patient who has been managing Type 2 diabetes for 6 months. Review their current medication regimen, discuss lifestyle modifications, and address their concerns about blood sugar control.",
        context: "You are meeting with Mrs. Sarah Chen, a 52-year-old accountant who was diagnosed with Type 2 diabetes 6 months ago. She has been taking Metformin 500mg twice daily and has been working with a dietitian.",
        objectives: [
          "Review current medication effectiveness",
          "Assess patient's understanding of condition",
          "Discuss lifestyle modifications and compliance", 
          "Address patient concerns and questions",
          "Provide clear next steps and follow-up plan"
        ],
        keyVocabulary: [
          "Blood glucose levels",
          "HbA1c",
          "Insulin resistance", 
          "Dietary compliance",
          "Hypoglycemia",
          "Medication adherence"
        ],
        patientBackground: {
          name: "Mrs. Sarah Chen",
          age: 52,
          occupation: "Accountant",
          concerns: [
            "Worried about long-term complications",
            "Difficulty maintaining diet during busy work periods",
            "Questions about exercise recommendations"
          ]
        }
      }
    }

    setTimeout(() => {
      setScenario(mockScenarios[scenarioId as keyof typeof mockScenarios] || mockScenarios["diabetes-consultation"])
      setIsLoading(false)
    }, 1000)
  }, [scenarioId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ backgroundColor: '#E0F2F1' }}></div>
            <div className="h-4 w-48 rounded mx-auto" style={{ backgroundColor: '#E0F2F1' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (sessionState === 'preview') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#36454F' }}>
                Practice Scenario
              </h1>
              <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
                Prepare for your OET speaking practice session
              </p>
            </div>

            {/* Scenario Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader style={{ backgroundColor: '#FAFAFA' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2" style={{ color: '#36454F' }}>
                      {scenario.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: '#E0F2F1', color: '#008080' }}
                      >
                        {scenario.profession}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: '#FFF3E0', color: '#FF8C00' }}
                      >
                        {scenario.difficulty}
                      </Badge>
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: '#F3E5F5', color: '#8B5CF6' }}
                      >
                        {scenario.duration}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Scenario Description */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: '#36454F' }}>
                        Scenario Description
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#36454F' }}>
                        {scenario.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: '#36454F' }}>
                        Clinical Context
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#36454F' }}>
                        {scenario.context}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: '#36454F' }}>
                        Learning Objectives
                      </h3>
                      <ul className="space-y-2">
                        {scenario.objectives.map((objective: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2 text-sm" style={{ color: '#36454F' }}>
                            <span style={{ color: '#008080' }}>•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Patient Information & Preparation */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: '#36454F' }}>
                        Patient Information
                      </h3>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F0FDFA' }}>
                        <h4 className="font-semibold mb-2" style={{ color: '#008080' }}>
                          {scenario.patientBackground.name}
                        </h4>
                        <p className="text-sm mb-3" style={{ color: '#36454F' }}>
                          {scenario.patientBackground.age} years old, {scenario.patientBackground.occupation}
                        </p>
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: '#36454F' }}>
                            Patient Concerns:
                          </p>
                          <ul className="space-y-1">
                            {scenario.patientBackground.concerns.map((concern: string, index: number) => (
                              <li key={index} className="text-sm flex items-start space-x-2" style={{ color: '#36454F' }}>
                                <span style={{ color: '#FF8C00' }}>•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3" style={{ color: '#36454F' }}>
                        Key Vocabulary
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {scenario.keyVocabulary.map((term: string, index: number) => (
                          <span 
                            key={index}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ 
                              backgroundColor: '#E0F2F1',
                              color: '#008080'
                            }}
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border" style={{ backgroundColor: '#FFFBF5', borderColor: '#FED7AA' }}>
                      <h4 className="font-semibold mb-2 flex items-center space-x-2" style={{ color: '#FF8C00' }}>
                        <span>💡</span>
                        <span>Practice Tips</span>
                      </h4>
                      <ul className="space-y-1 text-sm" style={{ color: '#36454F' }}>
                        <li>• Speak clearly and at a natural pace</li>
                        <li>• Show empathy and active listening</li>
                        <li>• Use appropriate medical terminology</li>
                        <li>• Maintain professional yet caring tone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start Practice Button */}
            <div className="text-center">
              <Button
                onClick={async () => {
                  // TODO: Replace with API call - POST /sessions/start
                  // const response = await apiCall('/sessions/start', {
                  //   method: 'POST',
                  //   body: JSON.stringify({ scenarioId })
                  // })
                  // const { sessionId, websocketUrl, livekitToken } = await response.json()
                  
                  setSessionState('active')
                  setSessionData(prev => ({ ...prev, startTime: Date.now() }))
                }}
                size="lg"
                className="px-12 py-4 text-lg font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                style={{ 
                  backgroundColor: '#008080',
                  color: 'white',
                  borderRadius: '12px'
                }}
              >
                Start Practice Session
              </Button>
              <p className="text-sm mt-4 opacity-70" style={{ color: '#36454F' }}>
                Make sure you're in a quiet environment with a good microphone
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Real-time conversation session
  if (sessionState === 'active') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <RealTimeConversation
            scenario={{
              id: scenario.id,
              title: scenario.title,
              description: scenario.description,
              profession: scenario.profession,
              difficulty: scenario.difficulty,
              duration: scenario.duration,
              patientProfile: {
                name: scenario.patientBackground.name,
                age: scenario.patientBackground.age,
                condition: scenario.title.includes('Diabetes') ? 'Type 2 Diabetes' : 'General Health Concern',
                background: `${scenario.patientBackground.age} years old ${scenario.patientBackground.occupation.toLowerCase()}. ${scenario.patientBackground.concerns.join(', ')}.`
              }
            }}
            onComplete={async (transcript) => {
              const duration = Math.floor((Date.now() - sessionData.startTime) / 1000)
              
              // TODO: Replace with API call - POST /sessions/{sessionId}/complete
              // const response = await apiCall(`/sessions/${sessionId}/complete`, {
              //   method: 'POST',
              //   body: JSON.stringify({ duration, transcript })
              // })
              // const { feedback, scores } = await response.json()
              
              setSessionData(prev => ({ 
                ...prev, 
                duration,
                completedPhases: transcript.length > 10 ? 5 : Math.min(Math.floor(transcript.length / 2), 5),
                transcript
              }))
              setSessionState('feedback')
            }}
          />
        </div>
      </div>
    )
  }

  if (sessionState === 'feedback') {
    return (
      <FeedbackReport
        scenario={scenario}
        sessionData={sessionData}
        onReturnToDashboard={() => router.push('/dashboard')}
        onRetrySession={() => {
          setSessionState('preview')
          setSessionData({
            duration: 0,
            completedPhases: 0,
            totalPhases: 5,
            startTime: 0,
            transcript: []
          })
        }}
      />
    )
  }

  return null
}