"use client"

import { useEffect, useState } from "react"
import StatCard from "@/components/dashboard/stat-card"
import ActivityFeed from "@/components/dashboard/activity-feed"
import ProgressChart from "@/components/dashboard/progress-chart"
import { Button } from "@/components/ui/button"
import apiClient, { type ProgressStats, type UserProgress, type Scenario } from "@/lib/api-client"

interface DashboardStats {
  title: string
  value: string | number
  description: string
  trend?: { value: number; isPositive: boolean }
  icon: string
}

interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'practice' | 'achievement' | 'progress'
  score?: number
}

interface ProgressItem {
  label: string
  current: number
  target: number
  color: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [progressData, setProgressData] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Get current user ID from auth context
      const userId = 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' // Using admin user for testing

      // Fetch progress stats
      const progressStatsResponse = await apiClient.getProgressStats(userId)
      const progressStats = progressStatsResponse.stats

      // Fetch user progress
      const userProgressResponse = await apiClient.getUserProgress(userId)
      const userProgress = userProgressResponse.progress

      // Fetch scenarios for activity generation
      const scenariosResponse = await apiClient.getScenarios()
      const scenarios = scenariosResponse.scenarios

      // Transform data for dashboard
      const dashboardStats: DashboardStats[] = [
        {
          title: "Practice Sessions",
          value: progressStats.total_scenarios,
          description: "Total scenarios",
          trend: { value: 15, isPositive: true },
          icon: "🎙️"
        },
        {
          title: "Average Score",
          value: `${Math.round(progressStats.average_score)}%`,
          description: "Overall performance",
          trend: { value: 8, isPositive: true },
          icon: "📊"
        },
        {
          title: "Practice Time",
          value: `${Math.round(progressStats.total_time_spent / 3600 * 10) / 10}h`,
          description: "Total time",
          trend: { value: 12, isPositive: true },
          icon: "⏱️"
        },
        {
          title: "Completed",
          value: progressStats.completed_scenarios,
          description: "Scenarios finished",
          icon: "✅"
        }
      ]

      // Generate activities from recent progress
      const recentActivities: ActivityItem[] = progressStats.recent_progress.map((progress, index) => ({
        id: progress.id,
        title: progress.scenario_title || "Practice Session",
        description: `${progress.status === 'completed' ? 'Completed' : 'In Progress'} - ${progress.attempts} attempt${progress.attempts > 1 ? 's' : ''}`,
        timestamp: formatTimestamp(progress.last_accessed_at),
        type: 'practice' as const,
        score: progress.score ? Math.round(progress.score) : undefined
      }))

      // Add achievement for completed scenarios
      if (progressStats.completed_scenarios > 0) {
        recentActivities.unshift({
          id: 'achievement-1',
          title: 'Achievement Unlocked',
          description: `Completed ${progressStats.completed_scenarios} scenario${progressStats.completed_scenarios > 1 ? 's' : ''}!`,
          timestamp: '1 day ago',
          type: 'achievement' as const
        })
      }

      // Generate progress chart data
      const progressChartData: ProgressItem[] = [
        {
          label: "Speaking Fluency",
          current: Math.min(progressStats.average_score || 0, 100),
          target: 100,
          color: "#008080"
        },
        {
          label: "Completion Rate", 
          current: progressStats.total_scenarios > 0 
            ? Math.round((progressStats.completed_scenarios / progressStats.total_scenarios) * 100)
            : 0,
          target: 100,
          color: "#FF8C00"
        },
        {
          label: "Practice Consistency",
          current: Math.min(progressStats.total_attempts * 10, 100), // Rough metric
          target: 100,
          color: "#22C55E"
        }
      ]

      setStats(dashboardStats)
      setActivities(recentActivities)
      setProgressData(progressChartData)
      setUserName("Admin") // TODO: Get from user profile

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
      
      // Fallback to mock data
      setStats([
        {
          title: "Practice Sessions",
          value: 0,
          description: "No data available",
          icon: "🎙️"
        }
      ])
      setActivities([])
      setProgressData([])
      
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4 text-red-500">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#36454F' }}>
            Welcome Back, {userName}
          </h1>
          <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
            Ready to continue your OET speaking practice? You're doing great!
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>
              Continue Practice
            </h3>
            <p className="text-sm mb-4" style={{ color: '#36454F', opacity: 0.8 }}>
              Pick up where you left off with profession-specific scenarios
            </p>
            <Button 
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: '#008080' }}
              onClick={() => window.location.href = '/scenarios'}
            >
              Start Practice Session
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>
              Track Progress
            </h3>
            <p className="text-sm mb-4" style={{ color: '#36454F', opacity: 0.8 }}>
              View detailed analytics and improvement trends
            </p>
            <Button 
              variant="outline"
              className="w-full hover:opacity-90"
              style={{ borderColor: '#008080', color: '#008080' }}
              onClick={() => window.location.href = '/progress'}
            >
              View Progress
            </Button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold mb-2" style={{ color: '#36454F' }}>
              Explore Library
            </h3>
            <p className="text-sm mb-4" style={{ color: '#36454F', opacity: 0.8 }}>
              Browse scenarios tailored to your profession
            </p>
            <Button 
              variant="outline"
              className="w-full hover:opacity-90"
              style={{ borderColor: '#FF8C00', color: '#FF8C00' }}
              onClick={() => window.location.href = '/scenarios'}
            >
              Browse Scenarios
            </Button>
          </div>
        </div>

        {/* Progress and Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressChart 
            title="Your Progress Overview"
            data={progressData}
          />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  )
}