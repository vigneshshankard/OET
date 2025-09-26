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
      setSessionData(prev => ({ 
        ...prev, 
        startTime: Date.now(),
        totalPhases: scenario.dialogues?.length || 5
      }))
      
    } catch (err) {
      console.error('Failed to start session:', err)
      setError('Failed to start practice session. Please try again.')
    }
  }

  const completeSession = async () => {
    try {
      if (!practiceSession) return

      const duration = Math.floor((Date.now() - sessionData.startTime) / 1000)
      
      // Complete the session
      await apiClient.completeSession(practiceSession.id, duration)
      
      // Generate comprehensive feedback
      const feedbackResponse = await apiClient.generateFeedback({
        session_id: practiceSession.id,
        conversation_data: sessionData.transcript || [],
        criteria: ['fluency', 'vocabulary', 'communication', 'clinical_reasoning']
      })
      
      setSessionData(prev => ({
        ...prev,
        duration,
        feedback: feedbackResponse
      }))
      
      setSessionState('feedback')
      
    } catch (err) {
      console.error('Failed to complete session:', err)
      setError('Failed to complete session. Please try again.')
    }
  }

  const formatPatientPersona = (persona: any) => {
    if (typeof persona === 'string') {
      try {
        return JSON.parse(persona)
      } catch {
        return { name: 'Patient', age: 30, concerns: [] }
      }
    }
    return persona || { name: 'Patient', age: 30, concerns: [] }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800' 
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProfessionColor = (profession: string) => {
    switch (profession) {
      case 'doctor': return 'bg-blue-100 text-blue-800'
      case 'nurse': return 'bg-purple-100 text-purple-800'
      case 'dentist': return 'bg-teal-100 text-teal-800'
      case 'physiotherapist': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>Loading practice scenario...</p>
        </div>
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4 text-red-500">⚠️</div>
          <p className="text-red-600 mb-4">{error || 'Scenario not found'}</p>
          <Button onClick={() => router.push('/scenarios')}>Back to Scenarios</Button>
        </div>
      </div>
    )
  }

  if (sessionState === 'preview') {
    const patientPersona = formatPatientPersona(scenario.patient_persona)
    
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push('/scenarios')}
            className="mb-4"
          >
            ← Back to Scenarios
          </Button>

          {/* Scenario Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={getProfessionColor(scenario.profession)}>
                  {scenario.profession}
                </Badge>
                <Badge className={getDifficultyColor(scenario.difficulty_level)}>
                  {scenario.difficulty_level}
                </Badge>
                <Badge variant="outline">
                  {scenario.clinical_area}
                </Badge>
              </div>
              <CardTitle className="text-2xl mb-2" style={{ color: '#36454F' }}>
                {scenario.title}
              </CardTitle>
              <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
                {scenario.description}
              </p>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Scenario Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Scenario Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Description</h4>
                  <p className="text-sm opacity-80" style={{ color: '#36454F' }}>
                    {scenario.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Clinical Area</h4>
                  <p className="text-sm" style={{ color: '#36454F' }}>
                    {scenario.clinical_area}
                  </p>
                </div>
                
                {scenario.dialogues && scenario.dialogues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Dialogue Steps</h4>
                    <p className="text-sm" style={{ color: '#36454F' }}>
                      {scenario.dialogues.length} conversation turns
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Patient Details</h4>
                  <div className="text-sm space-y-1" style={{ color: '#36454F' }}>
                    <p><strong>Name:</strong> {patientPersona.name || 'Patient'}</p>
                    <p><strong>Age:</strong> {patientPersona.age || 'Not specified'}</p>
                    {patientPersona.background && (
                      <p><strong>Background:</strong> {patientPersona.background}</p>
                    )}
                  </div>
                </div>
                
                {patientPersona.concerns && patientPersona.concerns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Patient Concerns</h4>
                    <ul className="text-sm space-y-1" style={{ color: '#36454F' }}>
                      {patientPersona.concerns.map((concern: string, index: number) => (
                        <li key={index}>• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {patientPersona.personality && (
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: '#36454F' }}>Personality</h4>
                    <p className="text-sm" style={{ color: '#36454F' }}>
                      {patientPersona.personality}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Start Practice Button */}
          <div className="text-center py-6">
            <Button
              onClick={startSession}
              size="lg"
              className="px-8 py-3 text-lg"
              style={{ backgroundColor: '#008080', color: 'white' }}
            >
              🎙️ Start Practice Session
            </Button>
            <p className="text-sm mt-2 opacity-70" style={{ color: '#36454F' }}>
              This will start a real-time conversation practice with AI feedback
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (sessionState === 'active') {
    return (
      <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
        <RealTimeConversation 
          scenario={{
            id: scenario!.id,
            title: scenario!.title,
            description: scenario!.description,
            profession: scenario!.profession,
            difficulty: scenario!.difficulty_level,
            duration: "8-12 minutes",
            patientProfile: {
              name: formatPatientPersona(scenario!.patient_persona).name || "Patient",
              age: formatPatientPersona(scenario!.patient_persona).age || 30,
              condition: scenario!.clinical_area,
              background: formatPatientPersona(scenario!.patient_persona).background || "Standard patient background"
            }
          }}
          onComplete={(transcript) => {
            setSessionData(prev => ({
              ...prev,
              transcript,
              duration: Math.floor((Date.now() - prev.startTime) / 1000)
            }))
            completeSession()
          }}
        />
      </div>
    )
  }

  if (sessionState === 'feedback') {
    return (
      <div style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
        <FeedbackReport
          scenario={scenario}
          sessionData={sessionData}
          onRetrySession={() => {
            setSessionState('preview')
            setSessionData({
              duration: 0,
              completedPhases: 0,
              totalPhases: 5,
              startTime: 0,
              transcript: []
            })
            setPracticeSession(null)
          }}
          onReturnToDashboard={() => {
            router.push('/dashboard')
          }}
        />
      </div>
    )
  }

  return null
}