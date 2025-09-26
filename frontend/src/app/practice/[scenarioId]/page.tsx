import PracticeScenario from "@/components/practice/practice-scenario"
import { PracticeErrorBoundary } from "@/components/error-boundary"

interface PageProps {
  params: {
    scenarioId: string
  }
}

export default function PracticePage({ params }: PageProps) {
  return (
    <PracticeErrorBoundary
      sessionId={params.scenarioId}
      onPracticeError={(error) => {
        console.error('Practice session error:', error)
        // Save error state for potential recovery
        localStorage.setItem(`practice_error_${params.scenarioId}`, JSON.stringify({
          error: error.message,
          timestamp: Date.now(),
          scenarioId: params.scenarioId
        }))
      }}
      onReturnToDashboard={() => {
        window.location.href = '/dashboard'
      }}
    >
      <PracticeScenario scenarioId={params.scenarioId} />
    </PracticeErrorBoundary>
  )
}

export function generateStaticParams() {
  return [
    { scenarioId: 'diabetes-consultation' },
    { scenarioId: 'emergency-chest-pain' },
    { scenarioId: 'post-surgery-followup' }
  ]
}