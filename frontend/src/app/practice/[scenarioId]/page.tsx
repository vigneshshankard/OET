import PracticeScenario from "@/components/practice/practice-scenario"

interface PageProps {
  params: {
    scenarioId: string
  }
}

export default function PracticePage({ params }: PageProps) {
  return <PracticeScenario scenarioId={params.scenarioId} />
}

export function generateStaticParams() {
  return [
    { scenarioId: 'diabetes-consultation' },
    { scenarioId: 'emergency-chest-pain' },
    { scenarioId: 'post-surgery-followup' }
  ]
}