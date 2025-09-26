"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import StatCard from "@/components/dashboard/stat-card"
import ActivityFeed from "@/components/dashboard/activity-feed"
import ProgressChart from "@/components/dashboard/progress-chart"
import { Button } from "@/components/ui/button"
import apiClient, { type ProgressStats, type UserProgress, type Scenario } from "@/lib/api-client"
import { AuthErrorBoundary, APIErrorBoundary } from "@/components/error-boundary"

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
      
      const { user } = useAuth()
      if (!user) {
        console.error('No authenticated user found')
        return
      }
      
      // For now, using mock data until API endpoints are implemented
      // TODO: Replace with actual API calls when backend is ready
      const mockStats: DashboardStats[] = [
        {
          title: "Scenarios Completed",
          value: 12,
          description: "Practice sessions",
          trend: { value: 8, isPositive: true },
          icon: "📚"
        },
        {
          title: "Average Score", 
          value: "85%",
          description: "Communication skills",
          trend: { value: 5, isPositive: true },
          icon: "📈"
        },
        {
          title: "Study Streak",
          value: 7,
          description: "Days in a row",
          trend: { value: 2, isPositive: true },
          icon: "🔥"
        },
        {
          title: "Total Practice Time",
          value: "24h",
          description: "This month",
          trend: { value: 12, isPositive: true },
          icon: "⏰"
        }
      ]

      const mockActivity: ActivityItem[] = [
        {
          id: "1",
          title: "Completed Chest Pain Consultation",
          description: "Scored 88% in Emergency Medicine scenario",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: "practice",
          score: 88
        },
        {
          id: "2", 
          title: "Achievement Unlocked",
          description: "Completed 10 scenarios milestone",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: "achievement"
        }
      ]

      const mockProgress: ProgressItem[] = [
        { label: "Communication", current: 85, target: 90, color: "#0EA5E9" },
        { label: "Clinical Reasoning", current: 78, target: 85, color: "#10B981" },
        { label: "Patient Empathy", current: 92, target: 95, color: "#F59E0B" }
      ]

      setStats(mockStats)
      setActivities(mockActivity)
      setProgressData(mockProgress)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
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
    <AuthErrorBoundary onAuthError={() => console.error('Dashboard auth error')}>
      <APIErrorBoundary 
        endpoint="/api/dashboard" 
        onAPIError={(error) => console.error('Dashboard API error:', error)}
      >
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
      </APIErrorBoundary>
    </AuthErrorBoundary>
  )
}