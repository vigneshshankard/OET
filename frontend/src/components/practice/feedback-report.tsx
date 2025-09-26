"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SimpleCircularProgress from "@/components/dashboard/simple-circular-progress"

interface FeedbackReportProps {
  scenario: any
  sessionData: {
    duration: number
    completedPhases: number
    totalPhases: number
  }
  onReturnToDashboard: () => void
  onRetrySession: () => void
}

export default function FeedbackReport({ 
  scenario, 
  sessionData, 
  onReturnToDashboard, 
  onRetrySession 
}: FeedbackReportProps) {
  // Mock feedback data - in real app would come from AI analysis
  const feedbackData = {
    overallScore: 82,
    breakdown: {
      communication: 85,
      vocabulary: 78,
      fluency: 80,
      empathy: 88,
      clinical: 84
    },
    strengths: [
      "Excellent empathetic communication with patient",
      "Clear explanation of medical concepts", 
      "Professional and reassuring tone throughout",
      "Good use of active listening techniques"
    ],
    improvements: [
      "Consider using more specific medical terminology for diabetes management",
      "Practice pause management during patient responses",
      "Enhance explanation of long-term complications and prevention"
    ],
    keyMoments: [
      {
        phase: "Opening Consultation",
        score: 90,
        feedback: "Excellent warm greeting and professional introduction. Patient felt comfortable immediately.",
        suggestion: "Perfect approach - maintain this standard."
      },
      {
        phase: "Medication Review",
        score: 78,
        feedback: "Good discussion of current medication. Could have been more specific about dosage adjustments.",
        suggestion: "Ask more detailed questions about side effects and timing of medication."
      },
      {
        phase: "Lifestyle Discussion", 
        score: 85,
        feedback: "Very good empathetic response to patient's work challenges. Practical advice given.",
        suggestion: "Consider providing written resources for busy professionals."
      }
    ]
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#22C55E'
    if (score >= 75) return '#008080' 
    if (score >= 65) return '#FF8C00'
    return '#EF4444'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 65) return 'Satisfactory'
    return 'Needs Improvement'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#36454F' }}>
              Practice Session Complete!
            </h1>
            <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
              Here's your detailed performance analysis
            </p>
          </div>

          {/* Overall Score Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center">
                  <SimpleCircularProgress
                    percentage={feedbackData.overallScore}
                    color={getScoreColor(feedbackData.overallScore)}
                    label="Overall Performance"
                    size={200}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#36454F' }}>
                      {getScoreLabel(feedbackData.overallScore)}
                    </h3>
                    <p className="text-lg mb-4" style={{ color: getScoreColor(feedbackData.overallScore) }}>
                      Score: {feedbackData.overallScore}/100
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium" style={{ color: '#36454F' }}>Session Duration:</span>
                      <div className="font-bold" style={{ color: '#008080' }}>{formatDuration(sessionData.duration)}</div>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#36454F' }}>Completion:</span>
                      <div className="font-bold" style={{ color: '#008080' }}>
                        {sessionData.completedPhases}/{sessionData.totalPhases} phases
                      </div>
                    </div>
                  </div>

                  <Badge 
                    className="text-sm px-4 py-2"
                    style={{ 
                      backgroundColor: '#E0F2F1', 
                      color: '#008080' 
                    }}
                  >
                    {scenario.title}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Skills Breakdown */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Skills Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(feedbackData.breakdown).map(([skill, score]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize" style={{ color: '#36454F' }}>
                          {skill === 'clinical' ? 'Clinical Knowledge' : skill}
                        </span>
                        <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                          {score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Moments */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Session Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackData.keyMoments.map((moment, index) => (
                    <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: '#FAFAFA' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm" style={{ color: '#36454F' }}>
                          {moment.phase}
                        </h4>
                        <Badge
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${getScoreColor(moment.score)}20`,
                            color: getScoreColor(moment.score)
                          }}
                        >
                          {moment.score}%
                        </Badge>
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#36454F' }}>
                        {moment.feedback}
                      </p>
                      <p className="text-xs font-medium" style={{ color: '#008080' }}>
                        💡 {moment.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Strengths */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2" style={{ color: '#36454F' }}>
                  <span>✅</span>
                  <span>Key Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedbackData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                      <span className="text-green-500 mt-1">•</span>
                      <p className="text-sm" style={{ color: '#36454F' }}>{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2" style={{ color: '#36454F' }}>
                  <span>🎯</span>
                  <span>Focus Areas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedbackData.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#FFFBF5' }}>
                      <span className="text-orange-500 mt-1">•</span>
                      <p className="text-sm" style={{ color: '#36454F' }}>{improvement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle style={{ color: '#36454F' }}>Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F0FDFA' }}>
                  <div className="text-2xl mb-2">📚</div>
                  <h4 className="font-semibold mb-2" style={{ color: '#008080' }}>Study Resources</h4>
                  <p className="text-sm" style={{ color: '#36454F' }}>
                    Review medical terminology and diabetes management protocols
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F0F9FF' }}>
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold mb-2" style={{ color: '#3B82F6' }}>Practice More</h4>
                  <p className="text-sm" style={{ color: '#36454F' }}>
                    Try similar scenarios to reinforce your consultation skills
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#FFFBF5' }}>
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold mb-2" style={{ color: '#FF8C00' }}>Peer Review</h4>
                  <p className="text-sm" style={{ color: '#36454F' }}>
                    Share your session with colleagues for additional feedback
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onRetrySession}
              size="lg"
              variant="outline"
              className="px-8"
              style={{ borderColor: '#008080', color: '#008080' }}
            >
              Practice Again
            </Button>
            <Button
              onClick={onReturnToDashboard}
              size="lg"
              className="px-8"
              style={{ backgroundColor: '#008080', color: 'white' }}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}