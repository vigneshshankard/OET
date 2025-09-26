"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newRegistrations: number
    retentionRate: number
    averageSessionTime: number
  }
  sessionMetrics: {
    totalSessions: number
    averageScore: number
    completionRate: number
    averageRating: number
  }
  contentMetrics: {
    totalScenarios: number
    popularScenarios: Array<{
      id: string
      title: string
      completions: number
      averageScore: number
      averageRating: number
    }>
    categoryBreakdown: Array<{
      category: string
      count: number
      color: string
    }>
  }
  usageData: Array<{
    date: string
    users: number
    sessions: number
    completions: number
  }>
  professionData: Array<{
    profession: string
    users: number
    sessions: number
    averageScore: number
  }>
  performanceData: Array<{
    skill: string
    averageScore: number
    improvement: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data from backend
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeRange })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      const analyticsData: AnalyticsData = result.data || {
        userMetrics: {
          totalUsers: 1247,
          activeUsers: 892,
          newRegistrations: 156,
          retentionRate: 68.5,
          averageSessionTime: 24.5
        },
        sessionMetrics: {
          totalSessions: 5623,
          averageScore: 78.2,
          completionRate: 85.7,
          averageRating: 4.3
        },
        contentMetrics: {
          totalScenarios: 42,
          popularScenarios: [
            {
              id: 'scenario-doc-001',
              title: 'Emergency Consultation - Chest Pain',
              completions: 234,
              averageScore: 82,
              averageRating: 4.7
            },
            {
              id: 'scenario-nurse-001',
              title: 'Post-Operative Patient Education',
              completions: 189,
              averageScore: 85,
              averageRating: 4.6
            },
            {
              id: 'scenario-dent-001',
              title: 'Routine Dental Cleaning Consultation',
              completions: 156,
              averageScore: 78,
              averageRating: 4.3
            }
          ],
          categoryBreakdown: [
            { category: 'Emergency Medicine', count: 8, color: '#0088FE' },
            { category: 'Patient Education', count: 6, color: '#00C49F' },
            { category: 'Preventive Care', count: 5, color: '#FFBB28' },
            { category: 'Endocrinology', count: 4, color: '#FF8042' },
            { category: 'Surgery', count: 3, color: '#8884d8' },
            { category: 'Other', count: 16, color: '#82ca9d' }
          ]
        },
        usageData: [
          { date: '2025-09-01', users: 45, sessions: 98, completions: 76 },
          { date: '2025-09-02', users: 52, sessions: 112, completions: 89 },
          { date: '2025-09-03', users: 48, sessions: 105, completions: 82 },
          { date: '2025-09-04', users: 61, sessions: 134, completions: 105 },
          { date: '2025-09-05', users: 58, sessions: 128, completions: 98 },
          { date: '2025-09-06', users: 39, sessions: 87, completions: 68 },
          { date: '2025-09-07', users: 42, sessions: 91, completions: 71 },
          { date: '2025-09-08', users: 55, sessions: 121, completions: 95 },
          { date: '2025-09-09', users: 67, sessions: 148, completions: 118 },
          { date: '2025-09-10', users: 71, sessions: 156, completions: 125 }
        ],
        professionData: [
          { profession: 'Doctor', users: 567, sessions: 2543, averageScore: 81.2 },
          { profession: 'Nurse', users: 423, sessions: 1876, averageScore: 79.8 },
          { profession: 'Dentist', users: 156, sessions: 698, averageScore: 75.4 },
          { profession: 'Physiotherapist', users: 101, sessions: 506, averageScore: 77.9 }
        ],
        performanceData: [
          { skill: 'Communication', averageScore: 78.5, improvement: 4.2 },
          { skill: 'Clinical Reasoning', averageScore: 75.8, improvement: 3.8 },
          { skill: 'Patient Empathy', averageScore: 82.1, improvement: 5.1 },
          { skill: 'Time Management', averageScore: 71.3, improvement: 2.9 },
          { skill: 'Documentation', averageScore: 79.6, improvement: 3.5 }
        ]
      }

      setAnalyticsData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform performance and user insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.userMetrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.userMetrics.activeUsers} active this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.sessionMetrics.totalSessions)}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.sessionMetrics.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.sessionMetrics.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.sessionMetrics.averageRating}★ average rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.userMetrics.averageSessionTime}m</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.userMetrics.retentionRate}% retention rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Daily active users and session data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={(value) => formatDate(value as string)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Active Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Category Distribution</CardTitle>
            <CardDescription>Scenarios by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.contentMetrics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.contentMetrics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Profession Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Profession</CardTitle>
          <CardDescription>User distribution and average scores across professions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.professionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="profession" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="users" fill="#8884d8" name="Users" />
              <Bar yAxisId="left" dataKey="sessions" fill="#82ca9d" name="Sessions" />
              <Line yAxisId="right" dataKey="averageScore" stroke="#ff7300" name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Skill Performance</CardTitle>
            <CardDescription>Average scores by skill area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.performanceData.map((skill) => (
                <div key={skill.skill} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <span className="text-sm text-gray-600">{skill.averageScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-teal-600 h-2 rounded-full" 
                        style={{ width: `${skill.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <Badge className="bg-green-100 text-green-800">
                      +{skill.improvement}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Scenarios</CardTitle>
            <CardDescription>Most completed practice scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.contentMetrics.popularScenarios.map((scenario, index) => (
                <div key={scenario.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-teal-800">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {scenario.title}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{scenario.completions} completions</span>
                      <span>{scenario.averageScore}% avg score</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-400" />
                        {scenario.averageRating}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration Trends</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analyticsData.usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip labelFormatter={(value) => formatDate(value as string)} />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}