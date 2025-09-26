"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface User {
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
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [professionFilter, setProfessionFilter] = useState<string>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, professionFilter, subscriptionFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users from backend admin API
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      const usersData: User[] = data.users || [
        {
          id: 'dac83a90-1d72-47b5-ad5f-036322fa7c0e',
          email: 'admin@oetpraxis.com',
          fullName: 'OET Admin',
          role: 'admin',
          profession: 'doctor',
          isEmailVerified: true,
          lastLoginAt: '2025-09-26T10:30:00Z',
          createdAt: '2025-01-01T00:00:00Z',
          sessionsCompleted: 0,
          subscriptionStatus: 'premium'
        },
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'dr.sarah.johnson@hospital.com',
          fullName: 'Dr. Sarah Johnson',
          role: 'user',
          profession: 'doctor',
          isEmailVerified: true,
          lastLoginAt: '2025-09-26T09:15:00Z',
          createdAt: '2025-09-15T14:20:00Z',
          sessionsCompleted: 12,
          subscriptionStatus: 'premium'
        },
        {
          id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          email: 'nurse.emma.wilson@clinic.org',
          fullName: 'Nurse Emma Wilson',
          role: 'user',
          profession: 'nurse',
          isEmailVerified: true,
          lastLoginAt: '2025-09-25T16:45:00Z',
          createdAt: '2025-09-20T11:10:00Z',
          sessionsCompleted: 8,
          subscriptionStatus: 'free'
        },
        {
          id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
          email: 'dr.michael.chen@dental.com',
          fullName: 'Dr. Michael Chen',
          role: 'user',
          profession: 'dentist',
          isEmailVerified: false,
          lastLoginAt: null,
          createdAt: '2025-09-24T08:30:00Z',
          sessionsCompleted: 0,
          subscriptionStatus: 'free'
        },
        {
          id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
          email: 'physio.alex.kumar@rehab.net',
          fullName: 'Alex Kumar',
          role: 'user',
          profession: 'physiotherapist',
          isEmailVerified: true,
          lastLoginAt: '2025-09-26T07:20:00Z',
          createdAt: '2025-09-18T13:45:00Z',
          sessionsCompleted: 15,
          subscriptionStatus: 'premium'
        }
      ]

      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Profession filter
    if (professionFilter !== 'all') {
      filtered = filtered.filter(user => user.profession === professionFilter)
    }

    // Subscription filter
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(user => user.subscriptionStatus === subscriptionFilter)
    }

    setFilteredUsers(filtered)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <p className="text-sm text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.lastLoginAt).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscriptionStatus === 'premium').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => !u.isEmailVerified).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={professionFilter} onValueChange={setProfessionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Professions</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="dentist">Dentist</SelectItem>
                <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{user.profession}</TableCell>
                  <TableCell>
                    <Badge className={getBadgeVariant(user.subscriptionStatus)}>
                      {user.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.sessionsCompleted}</TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Badge className={user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}