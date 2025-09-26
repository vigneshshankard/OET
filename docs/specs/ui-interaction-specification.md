# UI/UX Interaction Specification

Version: 1.0  
Last Updated: September 24, 2025

## Overview
This document specifies exact UI interaction behaviors, animations, states, and micro-interactions to eliminate any interpretation requirements.

## 1. Button Interactions

### 1.1 Button States and Transitions
```typescript
// Button state specifications
export const buttonStates = {
  default: {
    backgroundColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    border: 'border-transparent',
    cursor: 'cursor-pointer',
    transition: 'transition-all duration-200'
  },
  hover: {
    backgroundColor: 'bg-primary/90',
    transform: 'transform hover:scale-[1.02]',
    boxShadow: 'shadow-md'
  },
  active: {
    transform: 'transform active:scale-[0.98]',
    backgroundColor: 'bg-primary/80'
  },
  disabled: {
    backgroundColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    cursor: 'cursor-not-allowed',
    opacity: 'opacity-50'
  },
  loading: {
    cursor: 'cursor-not-allowed',
    opacity: 'opacity-75',
    icon: 'spinner-animation'
  }
}
```

### 1.2 Loading States
```typescript
// Exact loading button behavior
export const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <Button 
      disabled={loading} 
      className={cn(
        "relative",
        loading && "cursor-not-allowed opacity-75"
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      )}
      <span className={loading ? "opacity-0" : "opacity-100"}>
        {children}
      </span>
    </Button>
  )
}
```

## 2. Form Interactions

### 2.1 Input Field States
```typescript
export const inputStates = {
  default: {
    border: 'border-input',
    backgroundColor: 'bg-background',
    focusRing: 'focus:ring-2 focus:ring-ring focus:ring-offset-2',
    transition: 'transition-colors duration-200'
  },
  error: {
    border: 'border-destructive',
    backgroundColor: 'bg-destructive/5',
    focusRing: 'focus:ring-destructive'
  },
  success: {
    border: 'border-green-500',
    backgroundColor: 'bg-green-50'
  },
  disabled: {
    backgroundColor: 'bg-muted',
    cursor: 'cursor-not-allowed',
    opacity: 'opacity-50'
  }
}
```

### 2.2 Form Validation Display
```typescript
// Exact error message display timing and behavior
export const FormField = ({ name, error, children }) => {
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      // Show error with 150ms delay for smooth transition
      const timer = setTimeout(() => setShowError(true), 150)
      return () => clearTimeout(timer)
    } else {
      setShowError(false)
    }
  }, [error])

  return (
    <div className="space-y-2">
      {children}
      <div 
        className={cn(
          "min-h-[20px] transition-all duration-200",
          showError ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        )}
      >
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
```

## 3. Practice Session Interface

### 3.1 Recording States
```typescript
export const recordingStates = {
  idle: {
    buttonColor: 'bg-red-500',
    buttonText: 'Start Recording',
    icon: 'Mic',
    pulseAnimation: false
  },
  recording: {
    buttonColor: 'bg-red-600',
    buttonText: 'Stop Recording',
    icon: 'Square',
    pulseAnimation: true,
    pulseClass: 'animate-pulse shadow-lg shadow-red-500/50'
  },
  processing: {
    buttonColor: 'bg-gray-500',
    buttonText: 'Processing...',
    icon: 'Loader2',
    disabled: true,
    spinAnimation: true
  }
}
```

### 3.2 Real-time Feedback Display
```typescript
// Exact timing for real-time feedback updates
export const RealTimeFeedback = ({ isRecording, audioLevel }) => {
  const [visualBars, setVisualBars] = useState(Array(12).fill(0))

  useEffect(() => {
    if (!isRecording) {
      // Fade out animation over 500ms
      const fadeOut = setInterval(() => {
        setVisualBars(prev => prev.map(bar => Math.max(0, bar - 0.1)))
      }, 50)
      
      setTimeout(() => clearInterval(fadeOut), 500)
      return
    }

    // Update every 100ms during recording
    const interval = setInterval(() => {
      const newBars = Array(12).fill(0).map(() => 
        Math.random() * audioLevel * 0.8 + audioLevel * 0.2
      )
      setVisualBars(newBars)
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording, audioLevel])

  return (
    <div className="flex items-end gap-1 h-16">
      {visualBars.map((height, index) => (
        <div
          key={index}
          className={cn(
            "w-2 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-100",
            isRecording ? "opacity-100" : "opacity-40"
          )}
          style={{ height: `${Math.max(4, height * 60)}px` }}
        />
      ))}
    </div>
  )
}
```

## 4. Navigation and Routing

### 4.1 Page Transition Behavior
```typescript
// Exact page transition specifications
export const pageTransitions = {
  duration: 200,
  easing: 'ease-in-out',
  exitClass: 'opacity-0 translate-x-4',
  enterClass: 'opacity-100 translate-x-0',
  loadingClass: 'opacity-0'
}

export const PageTransition = ({ children, isLoading }) => {
  return (
    <div 
      className={cn(
        "transition-all duration-200",
        isLoading ? pageTransitions.loadingClass : pageTransitions.enterClass
      )}
    >
      {children}
    </div>
  )
}
```

### 4.2 Navigation Active States
```typescript
export const NavigationItem = ({ href, children, isActive }) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
      {isActive && (
        <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full" />
      )}
    </Link>
  )
}
```

## 5. Modal and Dialog Interactions

### 5.1 Modal Opening/Closing Animation
```typescript
export const modalAnimations = {
  backdrop: {
    enter: 'transition-opacity duration-200 opacity-0',
    enterActive: 'opacity-100',
    exit: 'transition-opacity duration-200 opacity-100',
    exitActive: 'opacity-0'
  },
  content: {
    enter: 'transition-all duration-200 opacity-0 scale-95 translate-y-2',
    enterActive: 'opacity-100 scale-100 translate-y-0',
    exit: 'transition-all duration-200 opacity-100 scale-100 translate-y-0',
    exitActive: 'opacity-0 scale-95 translate-y-2'
  }
}
```

### 5.2 Modal Focus Management
```typescript
export const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus trap - focus first focusable element after 100ms
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        firstFocusable?.focus()
      }, 100)

      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div ref={modalRef} className="relative">
        {children}
      </div>
    </div>
  )
}
```

## 6. Loading States and Skeletons

### 6.1 Skeleton Loading Patterns
```typescript
export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-muted rounded-lg h-48 mb-4"></div>
    <div className="space-y-2">
      <div className="bg-muted rounded h-4 w-3/4"></div>
      <div className="bg-muted rounded h-4 w-1/2"></div>
    </div>
  </div>
)

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array(count).fill(0).map((_, index) => (
      <div key={index} className="animate-pulse flex items-center space-x-4">
        <div className="bg-muted rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded h-4 w-3/4"></div>
          <div className="bg-muted rounded h-4 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
)
```

### 6.2 Progressive Loading Behavior
```typescript
// Exact timing for progressive content loading
export const useProgressiveLoading = (items: any[], delay = 100) => {
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    if (visibleCount < items.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [visibleCount, items.length, delay])

  return visibleCount
}
```

## 7. Toast Notifications

### 7.1 Toast Display Timing and Position
```typescript
export const toastConfig = {
  duration: {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 3000
  },
  position: 'bottom-right',
  maxVisible: 3,
  animation: {
    enter: 'animate-in slide-in-from-right-full',
    exit: 'animate-out slide-out-to-right-full'
  }
}

export const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toastConfig.duration[type])
    return () => clearTimeout(timer)
  }, [type, onClose])

  return (
    <div className={cn(
      "flex items-center gap-2 p-4 rounded-lg shadow-lg",
      toastConfig.animation.enter,
      {
        'bg-green-500 text-white': type === 'success',
        'bg-red-500 text-white': type === 'error',
        'bg-yellow-500 text-black': type === 'warning',
        'bg-blue-500 text-white': type === 'info'
      }
    )}>
      {message}
      <button onClick={onClose} className="ml-auto">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
```

## 8. Accessibility Interactions

### 8.1 Keyboard Navigation
```typescript
export const useKeyboardNavigation = (items: string[], onSelect: (item: string) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, -1))
          break
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault()
            onSelect(items[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setSelectedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedIndex, onSelect])

  return selectedIndex
}
```

### 8.2 Screen Reader Announcements
```typescript
export const useScreenReaderAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return announce
}
```