"use client"

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  label?: string
  sublabel?: string
  showPercentage?: boolean
  animated?: boolean
}

export default function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#008080",
  backgroundColor = "#E6F3F3",
  label,
  sublabel,
  showPercentage = true,
  animated = true
}: CircularProgressProps) {
  const normalizedValue = Math.min(Math.max(value, 0), max)
  const percentage = (normalizedValue / max) * 100
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg 
          className="transform -rotate-90"
          width={size} 
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={animated ? "transition-all duration-1000 ease-out" : ""}
            style={{
              filter: "drop-shadow(0 0 6px rgba(0, 128, 128, 0.3))"
            }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <span 
              className="text-2xl font-bold"
              style={{ color: "#36454F" }}
            >
              {Math.round(percentage)}%
            </span>
          )}
          {sublabel && (
            <span 
              className="text-xs opacity-70"
              style={{ color: "#36454F" }}
            >
              {sublabel}
            </span>
          )}
        </div>
      </div>
      
      {/* Label */}
      {label && (
        <div className="text-center">
          <p 
            className="text-sm font-medium"
            style={{ color: "#36454F" }}
          >
            {label}
          </p>
        </div>
      )}
    </div>
  )
}