"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface Scenario {
  id: string
  title: string
  description: string
  profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  duration: number
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
  createdBy: string
  completions: number
  averageScore: number
  averageRating: number
}

interface CreateScenarioData {
  title: string
  description: string
  profession: string
  difficulty: string
  category: string
  duration: number
  patientPersona: {
    name: string
    age: number
    condition: string
    background: string
  }
}

export default function ScenariosManagementPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [professionFilter, setProfessionFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFormData, setCreateFormData] = useState<CreateScenarioData>({
    title: '',
    description: '',
    profession: '',
    difficulty: '',
    category: '',
    duration: 30,
    patientPersona: {
      name: '',
      age: 0,
      condition: '',
      background: ''
    }
  })

  useEffect(() => {
    loadScenarios()
  }, [])

  useEffect(() => {
    filterScenarios()
  }, [scenarios, searchQuery, professionFilter, difficultyFilter, statusFilter])

  const loadScenarios = async () => {
    try {
      setLoading(true)
      
      // Fetch scenarios from backend content service
      const response = await fetch('/api/admin/scenarios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch scenarios')
      }

      const data = await response.json()
      const scenariosData: Scenario[] = data.scenarios || [
        {
          id: 'scenario-doc-001',
          title: 'Emergency Consultation - Chest Pain',
          description: 'A 45-year-old patient presents to the emergency department with sudden onset chest pain.',
          profession: 'doctor',
          difficulty: 'intermediate',
          category: 'Emergency Medicine',
          duration: 25,
          status: 'published',
          createdAt: '2025-09-20T14:30:00Z',
          updatedAt: '2025-09-22T10:15:00Z',
          createdBy: 'OET Admin',
          completions: 234,
          averageScore: 82,
          averageRating: 4.7
        },
        {
          id: 'scenario-nurse-001',
          title: 'Post-Operative Patient Education',
          description: 'Educate a post-operative patient about wound care and recovery expectations.',
          profession: 'nurse',
          difficulty: 'beginner',
          category: 'Patient Education',
          duration: 20,
          status: 'published',
          createdAt: '2025-09-18T09:45:00Z',
          updatedAt: '2025-09-19T16:20:00Z',
          createdBy: 'OET Admin',
          completions: 189,
          averageScore: 85,
          averageRating: 4.6
        },
        {
          id: 'scenario-doc-002',
          title: 'Diabetes Management Follow-up',
          description: 'Follow-up consultation with a Type 2 diabetes patient discussing medication adherence.',
          profession: 'doctor',
          difficulty: 'intermediate',
          category: 'Endocrinology',
          duration: 30,
          status: 'draft',
          createdAt: '2025-09-25T11:00:00Z',
          updatedAt: '2025-09-25T11:00:00Z',
          createdBy: 'OET Admin',
          completions: 0,
          averageScore: 0,
          averageRating: 0
        },
        {
          id: 'scenario-dent-001',
          title: 'Routine Dental Cleaning Consultation',
          description: 'Discuss oral hygiene and preventive care with a patient during routine cleaning.',
          profession: 'dentist',
          difficulty: 'beginner',
          category: 'Preventive Care',
          duration: 15,
          status: 'published',
          createdAt: '2025-09-15T13:20:00Z',
          updatedAt: '2025-09-16T08:30:00Z',
          createdBy: 'OET Admin',
          completions: 156,
          averageScore: 78,
          averageRating: 4.3
        }
      ]

      setScenarios(scenariosData)
    } catch (error) {
      console.error('Failed to load scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterScenarios = () => {
    let filtered = [...scenarios]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(scenario => 
        scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scenario.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Profession filter
    if (professionFilter !== 'all') {
      filtered = filtered.filter(scenario => scenario.profession === professionFilter)
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(scenario => scenario.difficulty === difficultyFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(scenario => scenario.status === statusFilter)
    }

    setFilteredScenarios(filtered)
  }

  const handleCreateScenario = async () => {
    try {
      // Create scenario via backend API
      const response = await fetch('/api/admin/scenarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createFormData)
      })

      if (!response.ok) {
        throw new Error('Failed to create scenario')
      }

      const result = await response.json()
      console.log('Scenario created successfully:', result)
      
      setShowCreateDialog(false)
      setCreateFormData({
        title: '',
        description: '',
        profession: '',
        difficulty: '',
        category: '',
        duration: 30,
        patientPersona: {
          name: '',
          age: 0,
          condition: '',
          background: ''
        }
      })
      
      // Reload scenarios
      await loadScenarios()
    } catch (error) {
      console.error('Failed to create scenario:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge className="bg-blue-100 text-blue-800">Beginner</Badge>
      case 'intermediate':
        return <Badge className="bg-orange-100 text-orange-800">Intermediate</Badge>
      case 'advanced':
        return <Badge className="bg-red-100 text-red-800">Advanced</Badge>
      default:
        return <Badge variant="secondary">{difficulty}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading scenarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Create and manage practice scenarios</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Scenario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scenario</DialogTitle>
              <DialogDescription>
                Create a new practice scenario for healthcare professionals
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Scenario Title</Label>
                  <Input
                    id="title"
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                    placeholder="Enter scenario title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={createFormData.category}
                    onChange={(e) => setCreateFormData({...createFormData, category: e.target.value})}
                    placeholder="e.g., Emergency Medicine"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createFormData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateFormData({...createFormData, description: e.target.value})}
                  placeholder="Describe the scenario context and patient presentation"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Select value={createFormData.profession} onValueChange={(value) => setCreateFormData({...createFormData, profession: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={createFormData.difficulty} onValueChange={(value) => setCreateFormData({...createFormData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={createFormData.duration}
                    onChange={(e) => setCreateFormData({...createFormData, duration: parseInt(e.target.value)})}
                    min="5"
                    max="60"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Patient Persona</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={createFormData.patientPersona.name}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        patientPersona: {...createFormData.patientPersona, name: e.target.value}
                      })}
                      placeholder="e.g., Sarah Johnson"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientAge">Age</Label>
                    <Input
                      id="patientAge"
                      type="number"
                      value={createFormData.patientPersona.age || ''}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        patientPersona: {...createFormData.patientPersona, age: parseInt(e.target.value)}
                      })}
                      placeholder="45"
                      min="1"
                      max="120"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Medical Condition</Label>
                  <Input
                    id="condition"
                    value={createFormData.patientPersona.condition}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      patientPersona: {...createFormData.patientPersona, condition: e.target.value}
                    })}
                    placeholder="e.g., Chest pain, Type 2 diabetes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background">Patient Background</Label>
                  <Textarea
                    id="background"
                    value={createFormData.patientPersona.background}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateFormData({
                      ...createFormData,
                      patientPersona: {...createFormData.patientPersona, background: e.target.value}
                    })}
                    placeholder="Brief background about the patient's history, occupation, concerns, etc."
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateScenario}>Create Scenario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scenarios</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenarios.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scenarios.filter(s => s.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scenarios.filter(s => s.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scenarios.reduce((sum, s) => sum + s.completions, 0)}
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
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
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
            
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scenarios ({filteredScenarios.length})</CardTitle>
          <CardDescription>
            Manage practice scenarios and their content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Profession</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Completions</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScenarios.map((scenario) => (
                <TableRow key={scenario.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{scenario.title}</div>
                      <div className="text-sm text-gray-500">{scenario.category}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{scenario.profession}</TableCell>
                  <TableCell>{getDifficultyBadge(scenario.difficulty)}</TableCell>
                  <TableCell>{getStatusBadge(scenario.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {scenario.duration}m
                    </div>
                  </TableCell>
                  <TableCell>{scenario.completions}</TableCell>
                  <TableCell>{scenario.averageScore ? `${scenario.averageScore}%` : '-'}</TableCell>
                  <TableCell>{formatDate(scenario.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/admin/scenarios/${scenario.id}`}>
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