# UI Design System - OET Application

Version: 1.0  
Last Updated: September 21, 2025

## Core Design Philosophy

Our design system is built on three fundamental principles:
1. **Clarity is King:** Eliminate all ambiguity. Every screen should have one primary action.
2. **Calm Confidence:** The UI must reduce test-taking anxiety. Use space, clear feedback, and supportive microcopy.
3. **Context is Everything:** The right tool must be present at the right moment in the user's task.

## Technology Stack

### Primary UI Framework
- **shadcn/ui**: Copy-paste component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for rapid custom styling
- **Radix UI**: Headless, accessible components for complex interactions
- **Recharts**: Responsive charts built on React components for progress visualization
- **Framer Motion**: Smooth animations for audio state transitions

## 1. Brand & Design Foundations

### 1.1 Design Tokens (Tailwind Configuration)

#### Primary Colors
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Trustworthy Blue
          50: '#eff6ff',
          500: '#2563EB',
          600: '#2563EB',
          900: '#1e3a8a'
        },
        professional: {
          DEFAULT: '#0F766E', // Professional Teal
          50: '#f0fdfa',
          500: '#0F766E',
          600: '#0d9488'
        },
        accent: {
          DEFAULT: '#CA8A04', // Accent for CTAs
          50: '#fefce8',
          500: '#CA8A04',
          600: '#a16207'
        }
      }
    }
  }
}
```

### 1.2 Typography System

#### Font Configuration
```javascript
// tailwind.config.js - Typography
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
},
fontSize: {
  'body': ['14px', { lineHeight: '20px' }],
  'paragraph': ['16px', { lineHeight: '24px' }],
  'subheader': ['20px', { lineHeight: '28px' }],
  'header': ['24px', { lineHeight: '32px' }],
}
```

#### shadcn/ui Typography Components
- Use `Typography` component for consistent text rendering
- Built-in responsive scaling
- Automatic accessibility attributes

### 1.3 Spacing

Based on 8px baseline grid:
- 8px (Extra small)
- 16px (Small)
- 24px (Medium)
- 32px (Large)
- 48px (Extra large)
- 64px (2x Extra large)

## 2. Component Specifications

## 2. shadcn/ui Component Specifications

### 2.1 Audio Interface Components

#### Recording State Components
```typescript
// Custom shadcn/ui components for audio states
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Recording State Indicators
interface AudioState {
  status: 'ready' | 'recording' | 'processing' | 'playing'
  quality: 'good' | 'poor' | 'silent'
  level: number
}

// Usage:
<Badge variant={audioState.status === 'recording' ? 'destructive' : 'secondary'}>
  {audioState.status === 'recording' ? 'Recording' : 'Ready'}
</Badge>
```

#### Audio Quality Monitoring
```typescript
// Real-time audio quality components
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

// Quality indicator with contextual help
<Alert variant={audioQuality === 'poor' ? 'destructive' : 'default'}>
  <AlertDescription>
    Audio quality: {audioQuality}
  </AlertDescription>
</Alert>
```

### 2.2 Dashboard & Analytics Components

#### Progress Charts (Recharts Integration)
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Score progress over time
<Card>
  <CardHeader>
    <CardTitle>Score Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={progressData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

#### Skill Level Radar Chart
```typescript
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Multi-dimensional skill assessment
<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={skillData}>
    <PolarGrid />
    <PolarAngleAxis dataKey="skill" />
    <PolarRadiusAxis domain={[0, 100]} />
    <Radar dataKey="level" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
  </RadarChart>
</ResponsiveContainer>
```

### 2.3 Session Interface Components

#### Practice Session Layout
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Main practice interface
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle>Patient Scenario</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Scenario content */}
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Practice Controls</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Audio controls */}
    </CardContent>
  </Card>
</div>
```

#### AI Interaction Components
```typescript
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

// AI thinking state
<div className="flex items-center space-x-2">
  <Avatar>
    <AvatarFallback>AI</AvatarFallback>
  </Avatar>
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
</div>
```

## 3. Responsive Design System

### 3.1 Tailwind Breakpoints
```javascript
// Custom breakpoints for OET Praxis
screens: {
  'xs': '475px',
  'sm': '640px',   // Phone (Landscape) / Small Tablet
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large Desktop
  '2xl': '1536px'
}
```

### 3.2 Responsive Layout Patterns
```typescript
// Mobile-first responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Auto-responsive cards */}
</div>

// Responsive text sizing
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
  Responsive Heading
</h1>

// Container with responsive padding
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### 3.3 Mobile-Specific Considerations
- Portrait lock during active sessions (CSS + JavaScript)
- Minimum tap target: 48x48dp (w-12 h-12 in Tailwind)
- Session state persistence using Zustand
- Touch-friendly audio controls

## 4. Animation System (Framer Motion)

### 4.1 Audio State Transitions
```typescript
import { motion, AnimatePresence } from 'framer-motion'

// Recording state animation
<motion.div
  animate={{
    scale: isRecording ? [1, 1.1, 1] : 1,
    opacity: isRecording ? [1, 0.8, 1] : 1
  }}
  transition={{
    duration: 1,
    repeat: isRecording ? Infinity : 0
  }}
>
  <Button variant={isRecording ? "destructive" : "default"}>
    {isRecording ? "Recording..." : "Start Practice"}
  </Button>
</motion.div>
```

### 4.2 Page Transitions
```typescript
// Smooth page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

## 5. Accessibility Requirements

### 5.1 shadcn/ui Accessibility Features
- **Radix UI Primitives**: Built-in WCAG compliance
- **Keyboard Navigation**: Full support via Radix components
- **Screen Reader**: Proper ARIA attributes included
- **Focus Management**: Automatic focus trapping in modals

### 5.2 Custom Accessibility Enhancements
```typescript
import { Button } from "@/components/ui/button"

// Audio controls with accessibility
<Button
  variant="outline"
  size="lg"
  aria-label={isRecording ? "Stop recording" : "Start recording"}
  aria-pressed={isRecording}
  className="min-w-[48px] min-h-[48px]" // Touch target size
>
  {isRecording ? "Stop" : "Start"}
</Button>
```

### 5.3 High Contrast Mode
```javascript
// Automatic high contrast support via CSS variables
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
}

@media (prefers-contrast: high) {
  :root {
    --primary: 221.2 83.2% 30%;
    --primary-foreground: 210 40% 100%;
  }
}
```

## 6. Loading States (shadcn/ui)

### 6.1 Skeleton Components
```typescript
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Dashboard loading state
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[80%]" />
  </CardContent>
</Card>
```

### 6.2 Processing States
```typescript
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// AI processing button
<Button disabled={isProcessing}>
  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isProcessing ? "AI is thinking..." : "Send Message"}
</Button>
```

## 7. Implementation Guidelines

### 7.1 Component Development
```typescript
// Custom component structure
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AudioControlsProps {
  className?: string
  onRecord: () => void
  isRecording: boolean
}

export function AudioControls({ className, onRecord, isRecording }: AudioControlsProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Audio Controls</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Custom audio interface */}
      </CardContent>
    </Card>
  )
}
```

### 7.2 Theme Configuration
```typescript
// app/globals.css - CSS variables for theming
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}
```

### 7.3 Performance Optimization
- **Tree Shaking**: Only import used shadcn/ui components
- **Code Splitting**: Lazy load chart components
- **Bundle Analysis**: Monitor Tailwind CSS purging
- **Component Lazy Loading**: Use React.lazy for heavy components

## 8. Production Considerations

### 8.1 Build Optimization
```javascript
// next.config.js optimizations
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

### 8.2 Quality Assurance
- **Component Testing**: Test all custom audio components
- **Accessibility Testing**: Automated a11y testing in CI/CD
- **Visual Regression**: Screenshot testing for UI consistency
- **Performance Monitoring**: Core Web Vitals tracking