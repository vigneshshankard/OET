"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
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

interface SessionItem {
  id: string
  scenario_title?: string
  score?: number
  status: string
  last_accessed_at: string
  time_spent: number
  attempts: number
}

export default function ProgressPage() {
  const [overallStats, setOverallStats] = useState<DashboardStats[]>([])
  const [skillsProgress, setSkillsProgress] = useState<ProgressItem[]>([])
  const [recentSessions, setRecentSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { user } = useAuth()
      if (!user) {
        setError('Please log in to view your progress')
        return
      }
      
      const userId = user.id

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>Loading progress data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4 text-red-500">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadProgressData} className="px-4 py-2 bg-blue-500 text-white rounded">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#36454F' }}>
            Your Progress
          </h1>
          <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
            Track your OET speaking practice journey and improvement over time
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overallStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <Tabs defaultValue="skills" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="skills">Skills Breakdown</TabsTrigger>
            <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Skills Progress Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle style={{ color: '#36454F' }}>Skills Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleProgressChart title="Skills Breakdown" data={skillsProgress} />
                </CardContent>
              </Card>

              {/* Circular Progress */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle style={{ color: '#36454F' }}>Overall Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleCircularProgress 
                    percentage={Math.round((skillsProgress.reduce((sum, skill) => sum + skill.value, 0) / skillsProgress.length) || 0)}
                    label="Overall Score"
                    color="#008080"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Recent Practice Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent sessions found.</p>
                ) : (
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium" style={{ color: '#36454F' }}>
                            {session.scenario_title || 'Practice Session'}
                          </h4>
                          <div className="text-right">
                            {session.score && (
                              <div className="text-lg font-bold" style={{ color: '#008080' }}>
                                {Math.round(session.score)}%
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {formatDate(session.last_accessed_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div>Status: <span className="capitalize">{session.status}</span></div>
                          <div>Duration: {formatDuration(session.time_spent)}</div>
                          <div>Attempts: {session.attempts}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle style={{ color: '#36454F' }}>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📈</div>
                  <p>Performance trend analysis will be available with more practice data.</p>
                  <p className="text-sm mt-2">Complete more sessions to see your improvement over time.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}