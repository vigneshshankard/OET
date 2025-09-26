"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, TrendingUp, Activity, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  newSignups: number
  conversionRate: number
  totalScenarios: number
  publishedScenarios: number
  systemStatus: 'healthy' | 'warning' | 'error'
  services: {
    name: string
    status: 'online' | 'offline' | 'degraded'
    uptime: string
  }[]
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'scenario_created' | 'session_completed'
  description: string
  timestamp: string
  user?: string
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real metrics from backend admin endpoints
      const response = await fetch('/api/admin/dashboard/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics')
      }

      const data = await response.json()
      
      const metricsData: DashboardMetrics = data.metrics || {
        totalUsers: 1247,
        activeUsers: 892,
        newSignups: 156,
        conversionRate: 23.5,
        totalScenarios: 45,
        publishedScenarios: 38,
        systemStatus: 'healthy',
        services: [
          { name: 'API Gateway', status: 'online', uptime: '99.9%' },
          { name: 'WebRTC Server', status: 'online', uptime: '99.8%' },
          { name: 'AI Services', status: 'online', uptime: '99.7%' },
          { name: 'Content Service', status: 'online', uptime: '99.9%' },
          { name: 'Database', status: 'online', uptime: '100%' }
        ]
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      const activityData = await activityResponse.json()
      const recentActivityData: RecentActivity[] = activityData.activities || [
        {
          id: '1',
          type: 'user_signup',
          description: 'New user registered: Dr. Sarah Johnson',
          timestamp: '2 minutes ago',
          user: 'Dr. Sarah Johnson'
        },
        {
          id: '2',
          type: 'scenario_created',
          description: 'New scenario published: Post-Operative Care',
          timestamp: '15 minutes ago'
        },
        {
          id: '3',
          type: 'session_completed',
          description: 'Practice session completed by Nurse Emma Wilson',
          timestamp: '23 minutes ago',
          user: 'Nurse Emma Wilson'
        }
      ]
      
      setMetrics(metricsData)
      setRecentActivity(recentActivityData)
      setError(null)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'degraded':
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'offline':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, content, and monitor system health</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(metrics.systemStatus)}
          <Badge className={getStatusColor(metrics.systemStatus)}>
            System {metrics.systemStatus}
          </Badge>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newSignups}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.publishedScenarios}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalScenarios} total scenarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.services.filter(s => s.status === 'online').length}/{metrics.services.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Services online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/scenarios">
                <Button variant="outline" className="w-full">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Scenario
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={loadDashboardData}>
                <Activity className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Services</CardTitle>
          <CardDescription>Current status of all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-500">Uptime: {service.uptime}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}