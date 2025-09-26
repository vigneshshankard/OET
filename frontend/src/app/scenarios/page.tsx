"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api-utils"
import { PatientPersona } from "@/types"

// Fetch scenarios with filters
async function fetchScenarios(filters?: { profession?: string; difficulty?: string }) {
  const params = new URLSearchParams()
  
  if (filters?.profession && filters.profession !== "all") {
    params.set('profession', filters.profession)
  }
  
  if (filters?.difficulty && filters.difficulty !== "all") {
    params.set('difficulty', filters.difficulty)
  }

  const endpoint = `/v1/content/scenarios${params.toString() ? '?' + params.toString() : ''}`
  
  return await apiRequest(endpoint, {}, false)
}

// Backend API types - matching our database schema
interface Scenario {
  id: string
  title: string
  description: string
  patient_persona: PatientPersona | string
  clinical_area: string
  difficulty_level: string
  profession: string
  status: string
  created_at: string
}

// API Client function is defined above

export default function ScenariosPage() {
  const [selectedProfession, setSelectedProfession] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadScenarios()
  }, [selectedProfession, selectedDifficulty])

  const loadScenarios = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: { profession?: string; difficulty?: string } = {}
      
      if (selectedProfession !== "all") {
        filters.profession = selectedProfession
      }
      
      if (selectedDifficulty !== "all") {
        filters.difficulty = selectedDifficulty
      }

      const response = await fetchScenarios(filters) as { scenarios: Scenario[] }
      setScenarios(response.scenarios || [])

    } catch (err) {
      console.error('Failed to load scenarios:', err)
      setError('Failed to load scenarios. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800' 
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProfessionColor = (profession: string) => {
    switch (profession) {
      case 'doctor': return 'bg-blue-100 text-blue-800'
      case 'nurse': return 'bg-purple-100 text-purple-800'
      case 'dentist': return 'bg-teal-100 text-teal-800'
      case 'physiotherapist': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: '#F8F8F8', minHeight: 'calc(100vh - 140px)' }}>
        <div className="text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>Loading scenarios...</p>
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
          <Button onClick={loadScenarios}>Try Again</Button>
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
            Practice Scenarios
          </h1>
          <p className="text-lg opacity-80" style={{ color: '#36454F' }}>
            Choose from {scenarios.length} realistic scenarios to practice your OET speaking skills
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#36454F' }}>
                Profession
              </label>
              <select 
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="border rounded-md px-3 py-2 min-w-[150px]"
              >
                <option value="all">All Professions</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="dentist">Dentist</option>
                <option value="physiotherapist">Physiotherapist</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#36454F' }}>
                Difficulty
              </label>
              <select 
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="border rounded-md px-3 py-2 min-w-[150px]"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {scenarios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#008080' }}>
                    {scenarios.length}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                    Total Scenarios
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#FF8C00' }}>
                    {new Set(scenarios.map(s => s.profession)).size}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                    Professions
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#22C55E' }}>
                    {scenarios.filter(s => s.status === 'published').length}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                    Published
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scenarios Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No scenarios found for the selected filters.</p>
            </div>
          ) : (
            scenarios.map((scenario) => (
              <Card key={scenario.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getProfessionColor(scenario.profession)}>
                      {scenario.profession}
                    </Badge>
                    <Badge className={getDifficultyColor(scenario.difficulty_level)}>
                      {scenario.difficulty_level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight" style={{ color: '#36454F' }}>
                    {scenario.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: '#36454F', opacity: 0.8 }}>
                    {scenario.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs" style={{ color: '#36454F', opacity: 0.6 }}>
                      <span>Clinical Area:</span>
                      <span>{scenario.clinical_area}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs" style={{ color: '#36454F', opacity: 0.6 }}>
                      <span>Status:</span>
                      <Badge variant={scenario.status === 'published' ? 'default' : 'secondary'}>
                        {scenario.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs" style={{ color: '#36454F', opacity: 0.6 }}>
                      <span>Created:</span>
                      <span>{formatDate(scenario.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {scenario.status === 'published' ? (
                      <Link href={`/practice/${scenario.id}`}>
                        <Button 
                          className="w-full"
                          style={{ backgroundColor: '#008080', color: 'white' }}
                        >
                          Start Practice
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full"
                        disabled
                        variant="secondary"
                      >
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}