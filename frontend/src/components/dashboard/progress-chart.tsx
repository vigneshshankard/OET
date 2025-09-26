import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProgressData {
  label: string
  current: number
  target: number
  color?: string
}

interface ProgressChartProps {
  title: string
  data: ProgressData[]
}

export default function ProgressChart({ title, data }: ProgressChartProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle style={{ color: '#36454F' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.current / item.target) * 100
            const color = item.color || '#008080'
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#36454F' }}>{item.label}</span>
                  <span style={{ color: '#36454F' }}>
                    {item.current}/{item.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
                <div className="text-xs opacity-70" style={{ color: '#36454F' }}>
                  {percentage.toFixed(0)}% complete
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}