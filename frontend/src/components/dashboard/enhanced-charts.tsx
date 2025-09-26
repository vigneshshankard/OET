"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LineChartProps {
  title: string
  data: {
    label: string
    value: number
    date?: string
  }[]
  color?: string
  height?: number
}

export function LineChart({ title, data, color = "#008080", height = 200 }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((item.value - minValue) / range) * 80 // 80% of height for padding
    return `${x},${y + 10}` // +10 for top padding
  }).join(' ')

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle style={{ color: '#36454F' }} className="text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: height }}>
          <svg 
            className="w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path 
                  d="M 20 0 L 0 0 0 20" 
                  fill="none" 
                  stroke="#E5E7EB" 
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" opacity="0.3" />
            
            {/* Area under the line */}
            <polygon
              points={`0,100 ${points} 100,100`}
              fill={`url(#gradient-${title.replace(/\s+/g, '')})`}
              opacity="0.2"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0, 128, 128, 0.2))"
              }}
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100
              const y = 100 - ((item.value - minValue) / range) * 80 + 10
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="2"
                    fill={color}
                    stroke="#F8F8F8"
                    strokeWidth="2"
                    className="hover:r-3 transition-all duration-200"
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                    }}
                  />
                </g>
              )
            })}
          </svg>
          
          {/* Data labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs px-2" style={{ color: '#36454F' }}>
            {data.map((item, index) => (
              <div key={index} className="text-center opacity-70">
                <div className="font-medium">{item.value}%</div>
                <div className="text-xs opacity-60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ScoreDistributionProps {
  title: string
  data: {
    range: string
    count: number
    color: string
  }[]
}

export function ScoreDistribution({ title, data }: ScoreDistributionProps) {
  const maxCount = Math.max(...data.map(d => d.count))

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <CardTitle style={{ color: '#36454F' }} className="text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm font-medium" style={{ color: '#36454F' }}>
                {item.range}
              </div>
              <div className="flex-1">
                <div 
                  className="h-6 rounded-full flex items-center justify-end px-3 transition-all duration-700 ease-out"
                  style={{ 
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: `${item.color}20`,
                    border: `1px solid ${item.color}40`
                  }}
                >
                  <span 
                    className="text-xs font-medium"
                    style={{ color: item.color }}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}