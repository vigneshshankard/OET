import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
}

export default function StatCard({ title, value, description, trend, icon }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: '#36454F' }}>
          {title}
        </CardTitle>
        {icon && (
          <div style={{ color: '#008080' }}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: '#36454F' }}>
          {value}
        </div>
        {description && (
          <p className="text-xs opacity-70 mt-1" style={{ color: '#36454F' }}>
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-2">
            <span 
              className={`inline-flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1 opacity-70" style={{ color: '#36454F' }}>
              from last week
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}