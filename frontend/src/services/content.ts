// Content service for fetching scenarios and related content

export interface Scenario {
  id: string
  title: string
  description: string
  profession: string
  difficulty: string
  duration: number
  patient_persona: {
    name: string
    age: number
    complaint: string
    background?: string
  }
}

export interface ScenarioWithDialogues extends Scenario {
  dialogues: Array<{
    id: string
    scenario_id: string
    speaker: 'patient' | 'system'
    message: string
    order_number: number
  }>
}

export class ContentService {
  async getScenarioDetails(scenarioId: string): Promise<{ scenario: Scenario }> {
    // Mock implementation for testing
    return {
      scenario: {
        id: scenarioId,
        title: 'Test Scenario',
        description: 'A test practice scenario',
        profession: 'doctor',
        difficulty: 'intermediate',
        duration: 15,
        patient_persona: {
          name: 'John Doe',
          age: 45,
          complaint: 'chest pain',
        }
      }
    }
  }

  async getScenarios(filters?: { profession?: string; difficulty?: string }): Promise<{ scenarios: Scenario[]; total: number }> {
    // Mock implementation
    return {
      scenarios: [],
      total: 0
    }
  }

  async getCompleteScenario(scenarioId: string): Promise<{ scenario: ScenarioWithDialogues }> {
    const { scenario } = await this.getScenarioDetails(scenarioId)
    return {
      scenario: {
        ...scenario,
        dialogues: []
      }
    }
  }
}

export const contentService = new ContentService()