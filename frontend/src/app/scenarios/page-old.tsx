"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import SelectField from "@/components/auth/select-field"

interface Scenario {
  id: string
  title: string
  description: string
  patient_persona: string
  clinical_area: string
  profession: "doctor" | "nurse" | "dentist" | "physiotherapist"
  difficulty_level: "beginner" | "intermediate" | "advanced"
  status: string
  created_at: string
}

// API Client function
const fetchScenarios = async (filters?: { profession?: string; difficulty?: string }) => {
  const params = new URLSearchParams()
  
  if (filters?.profession && filters.profession !== "all") {
    params.set('profession', filters.profession)
  }
  
  if (filters?.difficulty && filters.difficulty !== "all") {
    params.set('difficulty', filters.difficulty)
  }

  const url = `http://localhost:8000/v1/content/scenarios${params.toString() ? '?' + params.toString() : ''}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch scenarios: ${response.status}`)
  }
  
  return response.json()
}

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

      const response = await fetchScenarios(filters)
      setScenarios(response.scenarios)

    } catch (err) {
      console.error('Failed to load scenarios:', err)
      setError('Failed to load scenarios. Please try again.')
      // Keep existing scenarios on error to avoid empty state
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-2xl mb-4">🔄</div>
          <p>Loading scenarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-2xl mb-4 text-red-500">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadScenarios}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Filter scenarios based on selected profession and difficulty
  const filteredScenarios = scenarios.filter(scenario => {
    const professionMatch = selectedProfession === "all" || scenario.profession === selectedProfession
    const difficultyMatch = selectedDifficulty === "all" || scenario.difficulty_level === selectedDifficulty
    return professionMatch && difficultyMatch
  })

  const professionOptions = [
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "dentist", label: "Dentist" },
    { value: "physiotherapist", label: "Physiotherapist" }
  ]

  const difficultyOptions = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ]

  const filteredScenarios = scenarios.filter(scenario => {
    const professionMatch = scenario.profession === selectedProfession
    const difficultyMatch = selectedDifficulty === "all" || scenario.difficulty === selectedDifficulty
    return professionMatch && difficultyMatch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "#22C55E"
      case "intermediate": return "#FF8C00"
      case "advanced": return "#EF4444"
      default: return "#36454F"
    }
  }

  const getDifficultyBadgeStyle = (difficulty: string) => {
    const color = getDifficultyColor(difficulty)
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: color
    }
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
            Choose from profession-specific role-play scenarios to practice your OET speaking skills
          </p>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle style={{ color: '#36454F' }}>Filter Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <SelectField
                id="profession"
                label="Healthcare Profession"
                placeholder="Select profession"
                value={selectedProfession}
                onValueChange={setSelectedProfession}
                options={professionOptions}
              />
              <SelectField
                id="difficulty"
                label="Difficulty Level"
                placeholder="Select difficulty"
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
                options={difficultyOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scenarios Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold" style={{ color: '#36454F' }}>
              Available Scenarios ({filteredScenarios.length})
            </h2>
            <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
              Showing scenarios for {professionOptions.find(p => p.value === selectedProfession)?.label}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => (
              <Card key={scenario.id} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg leading-tight" style={{ color: '#36454F' }}>
                      {scenario.title}
                    </CardTitle>
                    {scenario.completed && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">✅</span>
                        <span className="text-sm font-medium" style={{ color: '#22C55E' }}>
                          {scenario.score}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge 
                      variant="outline"
                      style={getDifficultyBadgeStyle(scenario.difficulty)}
                    >
                      {scenario.difficulty}
                    </Badge>
                    <Badge 
                      variant="outline"
                      style={{
                        backgroundColor: '#E0F2F1',
                        color: '#008080',
                        borderColor: '#008080'
                      }}
                    >
                      {scenario.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 opacity-80" style={{ color: '#36454F' }}>
                    {scenario.description}
                  </p>
                  <div className="text-xs mb-4 opacity-60" style={{ color: '#36454F' }}>
                    Category: {scenario.category}
                  </div>
                  <Button
                    className="w-full text-white hover:opacity-90"
                    style={{ backgroundColor: scenario.completed ? '#22C55E' : '#008080' }}
                    asChild
                  >
                    <Link href={`/practice/${scenario.id}`}>
                      {scenario.completed ? 'Practice Again' : 'Start Practice'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredScenarios.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg opacity-60" style={{ color: '#36454F' }}>
                No scenarios found for the selected filters
              </p>
              <p className="text-sm opacity-40 mt-2" style={{ color: '#36454F' }}>
                Try adjusting your profession or difficulty level
              </p>
            </div>
          )}
        </div>

        {/* Progress Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle style={{ color: '#36454F' }}>Your Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: '#008080' }}>
                  {filteredScenarios.filter(s => s.completed).length}
                </div>
                <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#FF8C00' }}>
                  {filteredScenarios.filter(s => !s.completed).length}
                </div>
                <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                  Remaining
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#22C55E' }}>
                  {filteredScenarios.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) / filteredScenarios.filter(s => s.score).length || 0}%
                </div>
                <div className="text-sm opacity-70" style={{ color: '#36454F' }}>
                  Avg Score
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}