"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield, 
  Activity,
  TrendingUp,
  BookOpen,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface UserDetails {
  id: string
  email: string
  fullName: string
  role: 'user' | 'admin'
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
  isEmailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  sessionsCompleted: number
  subscriptionStatus: 'free' | 'premium' | 'expired'
  totalPracticeTime: number
  averageScore: number
  preferredLanguage: string
  timezone: string
}

interface SessionHistory {
  id: string
  scenarioTitle: string
  completedAt: string
  duration: number
  score: number
  profession: string
}

interface ProgressStats {
  communicationSkills: number
  clinicalKnowledge: number
  empathy: number
  clarity: number
  professionalism: number
  overallProgress: number
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetails | null>(null)
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadUserDetails()
    }
  }, [userId])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch user details from backend API
      const userResponse = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details')
      }

      const userData = await userResponse.json()
      const userDetails: UserDetails = userData.user || {
        id: userId,
        email: userId === 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' ? 'admin@oetpraxis.com' : 'dr.sarah.johnson@hospital.com',
        fullName: userId === 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' ? 'OET Admin' : 'Dr. Sarah Johnson',
        role: userId === 'dac83a90-1d72-47b5-ad5f-036322fa7c0e' ? 'admin' : 'user',
        profession: 'doctor',
        isEmailVerified: true,
        lastLoginAt: '2025-09-26T10:30:00Z',
        createdAt: '2025-09-15T14:20:00Z',
        sessionsCompleted: 12,
        subscriptionStatus: 'premium',
        totalPracticeTime: 3600, // minutes
        averageScore: 78.5,
        preferredLanguage: 'English',
        timezone: 'UTC'
      }

      // Fetch user sessions
      const sessionsResponse = await fetch(`/api/admin/users/${userId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      const sessionData = await sessionsResponse.json()
      const userSessions: SessionHistory[] = sessionData.sessions || [
        {
          id: '1',
          scenarioTitle: 'Emergency Room Patient Assessment',
          completedAt: '2025-09-26T09:15:00Z',
          duration: 25,
          score: 85,
          profession: 'doctor'
        },
        {
          id: '2',
          scenarioTitle: 'Patient Consultation - Diabetes',
          completedAt: '2025-09-25T14:30:00Z',
          duration: 30,
          score: 72,
          profession: 'doctor'
        },
        {
          id: '3',
          scenarioTitle: 'Post-Operative Care Discussion',
          completedAt: '2025-09-24T11:45:00Z',
          duration: 28,
          score: 79,
          profession: 'doctor'
        }
      ]

      // Fetch user progress statistics
      const progressResponse = await fetch(`/api/admin/users/${userId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      const progressData = await progressResponse.json()
      const userProgressStats: ProgressStats = progressData.progress || {
        communicationSkills: 82,
        clinicalKnowledge: 75,
        empathy: 88,
        clarity: 79,
        professionalism: 85,
        overallProgress: 78.5
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUser(userDetails)
      setSessions(userSessions)
      setProgressStats(userProgressStats)
    } catch (error) {
      console.error('Failed to load user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'premium':
        return 'bg-green-100 text-green-800'
      case 'free':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
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
          <p className="text-sm text-gray-600">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-600 mt-2">The requested user could not be found.</p>
        <Link href="/admin/users">
          <Button className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getBadgeVariant(user.role)}>
            {user.role}
          </Badge>
          <Badge className={getBadgeVariant(user.subscriptionStatus)}>
            {user.subscriptionStatus}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.sessionsCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(user.totalPracticeTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.averageScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Active</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {user.lastLoginAt ? formatDate(user.lastLoginAt).split(',')[0] : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="progress">Progress Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>User account details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Profession</p>
                      <p className="text-sm text-gray-600 capitalize">{user.profession}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-gray-600">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-sm text-gray-600">{formatDate(user.lastLoginAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Email Status</p>
                      <Badge className={user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Practice session history and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{session.scenarioTitle}</h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(session.completedAt)} • {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{session.score}%</div>
                      <Badge variant="secondary" className="text-xs">
                        {session.profession}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress Statistics</CardTitle>
              <CardDescription>Performance breakdown by skill area</CardDescription>
            </CardHeader>
            <CardContent>
              {progressStats && (
                <div className="space-y-6">
                  {Object.entries(progressStats).map(([skill, score]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">
                          {skill.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span>{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}