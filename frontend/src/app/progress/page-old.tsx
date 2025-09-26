"use client"

import { useState, useEffect } from "react"
import StatCard from "@/components/dashboard/stat-card"
import SimpleCircularProgress from "@/components/dashboard/simple-circular-progress"
import SimpleProgressChart from "@/components/dashboard/simple-progress-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import apiClient, { type ProgressStats, type UserProgress } from "@/lib/api-client"

interface DashboardStats {
  title: string
  value: string | number
  description: string
  trend?: { value: number; isPositive: boolean }
  icon: string
}

interface ProgressItem {
  label: string
  value: number
  max: number
  color: string
}

export default function ProgressPage() {
  const [overallStats, setOverallStats] = useState<DashboardStats[]>([])
  const [skillsProgress, setSkillsProgress] = useState<ProgressItem[]>([])
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Get current user ID from auth context
      const userId = 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' // Using admin user for testing

      // Fetch progress stats
      const progressStatsResponse = await apiClient.getProgressStats(userId)
      const progressStats = progressStatsResponse.stats

      // Fetch user progress sessions
      const userProgressResponse = await apiClient.getUserProgress(userId)
      const userProgress = userProgressResponse.progress

      // Transform data for dashboard
      const stats: DashboardStats[] = [
        {
          title: "Total Sessions",
          value: progressStats.total_scenarios,
          description: "All time",
          trend: { value: 12, isPositive: true },
          icon: "📚"
        },
        {
          title: "Average Score",
          value: `${Math.round(progressStats.average_score)}%`,
          description: "Last 30 days",
          trend: { value: 15, isPositive: true },
          icon: "🎯"
        },
        {
          title: "Completed",
          value: progressStats.completed_scenarios,
          description: "Scenarios finished",
          icon: "⭐"
        },
        {
          title: "Practice Hours",
          value: `${Math.round(progressStats.total_time_spent / 3600 * 10) / 10}h`,
          description: "Total practice time",
          trend: { value: 8, isPositive: true },
          icon: "⏰"
        }
      ]

      // Generate skills progress from stats
      const skills: ProgressItem[] = [
        {
          label: "Speaking Fluency",
          value: Math.min(progressStats.average_score || 0, 100),
          max: 100,
          color: "#008080"
        },
        {
          label: "Medical Vocabulary",
          value: Math.min((progressStats.average_score || 0) + 7, 100),
          max: 100,
          color: "#FF8C00"
        },
        {
          label: "Patient Communication",
          value: Math.min((progressStats.average_score || 0) - 5, 100),
          max: 100,
          color: "#22C55E"
        },
        {
          label: "Clinical Reasoning",
          value: Math.min((progressStats.average_score || 0) + 2, 100),
          max: 100,
          color: "#8B5CF6"
        }
      ]

      setOverallStats(stats)
      setSkillsProgress(skills)
      setRecentSessions(userProgress.slice(0, 10)) // Latest 10 sessions

    } catch (err) {
      console.error('Failed to load progress data:', err)
      setError('Failed to load progress data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const skillsProgressData = [
    {
      label: "Speaking Fluency",
      value: 78,
      max: 100,
      color: "#008080"
    },
    {
      label: "Medical Vocabulary",
      value: 85,
      max: 100,
      color: "#FF8C00"
    },
    {
      label: "Communication Skills",
      value: 72,
      max: 100,
      color: "#22C55E"
    },
    {
      label: "Professional Interaction",
      value: 80,
      max: 100,
      color: "#8B5CF6"
    }
  ]

  const recentSessionsData = [
    {
      id: "1",
      scenario: "Patient Consultation - Diabetes Management",
      date: "2025-09-23",
      score: 85,
      duration: "12 min",
      improvements: ["Better medical terminology", "Clear explanations"]
    },
    {
      id: "2", 
      scenario: "Emergency Department - Chest Pain Assessment",
      date: "2025-09-22",
      score: 78,
      duration: "15 min",
      improvements: ["Active listening", "Empathy expression"]
    },
    {
      id: "3",
      scenario: "Post-Surgery Follow-up Discussion",
      date: "2025-09-21", 
      score: 82,
      duration: "10 min",
      improvements: ["Pronunciation clarity", "Professional tone"]
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#36454F' }}>
              Progress Tracking
            </h1>
            <p className="text-lg opacity-80 max-w-2xl mx-auto" style={{ color: '#36454F' }}>
              Monitor your OET speaking practice improvement with detailed analytics and insights
            </p>
          </div>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overallStats.map((stat, index) => (
              <div key={index} className="transform hover:scale-105 transition-transform duration-300">
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          {/* Skills Overview - Circular Progress */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-8" style={{ backgroundColor: '#FAFAFA' }}>
              <CardTitle className="text-2xl" style={{ color: '#36454F' }}>
                Skills Progress Overview
              </CardTitle>
              <p className="text-sm opacity-70" style={{ color: '#36454F' }}>
                Your current performance across key OET speaking areas
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {skillsProgressData.map((skill, index) => (
                  <div key={index} className="text-center">
                    <SimpleCircularProgress
                      percentage={skill.value}
                      color={skill.color}
                      label={skill.label}
                      size={140}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Tabs */}
          <Tabs defaultValue="detailed" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
              <TabsTrigger 
                value="detailed" 
                className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
              >
                Detailed Progress
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
              >
                Insights & Tips
              </TabsTrigger>
              <TabsTrigger 
                value="sessions"
                className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700"
              >
                Recent Sessions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detailed" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <SimpleProgressChart 
                  title="Skills Breakdown"
                  data={skillsProgressData}
                />
                
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle style={{ color: '#36454F' }}>Achievement Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: '#E0F2F1' }}>
                        <div className="text-2xl">🏆</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#36454F' }}>Excellence Streak</p>
                          <p className="text-sm opacity-70" style={{ color: '#36454F' }}>5 sessions above 80%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: '#FFF3E0' }}>
                        <div className="text-2xl">📈</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#36454F' }}>Consistent Improver</p>
                          <p className="text-sm opacity-70" style={{ color: '#36454F' }}>+15% improvement this month</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                        <div className="text-2xl">⏱️</div>
                        <div>
                          <p className="font-semibold" style={{ color: '#36454F' }}>Dedicated Learner</p>
                          <p className="text-sm opacity-70" style={{ color: '#36454F' }}>28+ hours of practice</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle style={{ color: '#36454F' }}>💡 Personalized Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border-l-4 border-teal-500" style={{ backgroundColor: '#F0FDFA' }}>
                        <h4 className="font-semibold mb-2" style={{ color: '#008080' }}>Focus Area: Medical Vocabulary</h4>
                        <p className="text-sm" style={{ color: '#36454F' }}>
                          Your vocabulary scores show room for improvement. Practice with medical term flashcards daily.
                        </p>
                      </div>
                      
                      <div className="p-4 border-l-4 border-orange-500" style={{ backgroundColor: '#FFFBF5' }}>
                        <h4 className="font-semibold mb-2" style={{ color: '#FF8C00' }}>Strength: Professional Interaction</h4>
                        <p className="text-sm" style={{ color: '#36454F' }}>
                          Excellent empathy and communication skills. Consider mentoring newer learners.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle style={{ color: '#36454F' }}>📊 Progress Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm" style={{ color: '#36454F' }}>Weekly Goal Progress</span>
                          <span className="text-sm font-semibold" style={{ color: '#008080' }}>4/5 sessions</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{ width: '80%', backgroundColor: '#008080' }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm" style={{ color: '#36454F' }}>Monthly Improvement</span>
                          <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>+15%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{ width: '75%', backgroundColor: '#22C55E' }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle style={{ color: '#36454F' }}>Recent Practice Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {recentSessionsData.map((session) => (
                      <div 
                        key={session.id} 
                        className="p-6 rounded-lg border transition-all duration-300 hover:shadow-md"
                        style={{ backgroundColor: '#FAFAFA' }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-lg" style={{ color: '#36454F' }}>
                            {session.scenario}
                          </h4>
                          <div className="text-right">
                            <span 
                              className="text-2xl font-bold px-3 py-1 rounded-full"
                              style={{ 
                                color: session.score >= 80 ? '#22C55E' : session.score >= 70 ? '#FF8C00' : '#EF4444',
                                backgroundColor: session.score >= 80 ? '#F0FDF4' : session.score >= 70 ? '#FFFBEB' : '#FEF2F2'
                              }}
                            >
                              {session.score}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm opacity-70 mb-4" style={{ color: '#36454F' }}>
                          <span>📅 {session.date}</span>
                          <span>⏱️ {session.duration}</span>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: '#36454F' }}>
                            Key Improvements:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {session.improvements.map((improvement, index) => (
                              <span 
                                key={index}
                                className="text-xs px-3 py-1 rounded-full"
                                style={{ 
                                  backgroundColor: '#E0F2F1',
                                  color: '#008080'
                                }}
                              >
                                {improvement}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}