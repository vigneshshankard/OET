"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SimpleProgressChartProps {
  title: string
  data: {
    label: string
    value: number
    max: number
    color: string
  }[]
}

export default function SimpleProgressChart({ title, data }: SimpleProgressChartProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle style={{ color: '#36454F' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#36454F' }}>
                  {item.label}
                </span>
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {item.value}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(item.value / item.max) * 100}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}