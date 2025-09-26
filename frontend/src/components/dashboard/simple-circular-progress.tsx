"use client"

interface SimpleCircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function SimpleCircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "#008080",
  label
}: SimpleCircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E6F3F3"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s ease-in-out"
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: "#36454F" }}>
            {percentage}%
          </span>
        </div>
      </div>
      
      {label && (
        <p className="text-sm font-medium text-center" style={{ color: "#36454F" }}>
          {label}
        </p>
      )}
    </div>
  )
}