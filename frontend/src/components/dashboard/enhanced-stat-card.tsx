"use client"

import { Card, CardContent } from "@/components/ui/card"

interface EnhancedStatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: string
  gradient?: {
    from: string
    to: string
  }
  textColor?: string
}

export default function EnhancedStatCard({
  title,
  value,
  description,
  trend,
  icon,
  gradient = { from: "#008080", to: "#00A0A0" },
  textColor = "#FFFFFF"
}: EnhancedStatCardProps) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div 
        className="absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
        }}
      />
      <div className="absolute inset-0 bg-black opacity-5" />
      
      <CardContent className="relative p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-90 mb-1">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                {value}
              </h3>
              {trend && (
                <span 
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {trend.isPositive ? '+' : '-'}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs opacity-80 mt-1">
                {description}
              </p>
            )}
          </div>
          
          {icon && (
            <div className="text-2xl opacity-80">
              {icon}
            </div>
          )}
        </div>
        
        {/* Decorative element */}
        <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-white opacity-10" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-white opacity-5" />
      </CardContent>
    </Card>
  )
}