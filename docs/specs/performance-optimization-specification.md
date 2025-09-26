# Performance Optimization Specification

Version: 1.0  
Last Updated: September 24, 2025

## Overview
This document specifies exact performance optimization strategies, caching implementations, and monitoring configurations to eliminate developer assumptions about performance requirements.

## 1. Frontend Performance Optimization

### 1.1 Next.js Configuration for Performance
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC minification
  swcMinify: true,
  
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    domains: ['localhost', 'oetpraxis.com', 's3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new (require('@next/bundle-analyzer'))())
      return config
    }
  }),
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### 1.2 Component-Level Performance Patterns
```typescript
// src/lib/performance.ts
import { memo, useMemo, useCallback, lazy } from 'react'

// Memoization patterns
export const MemoizedComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveCalculation(item)
    }))
  }, [data])

  const handleAction = useCallback((id: string) => {
    onAction(id)
  }, [onAction])

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleAction(item.id)}>
          {item.processed}
        </div>
      ))}
    </div>
  )
})

// Lazy loading patterns
export const LazyComponents = {
  PracticeScenario: lazy(() => import('@/components/practice/practice-scenario')),
  FeedbackReport: lazy(() => import('@/components/feedback/feedback-report')),
  AdminDashboard: lazy(() => import('@/components/admin/admin-dashboard'))
}

// Virtual scrolling for large lists
export const VirtualizedList = ({ items, itemHeight = 80 }) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerHeight = 400
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const totalHeight = items.length * itemHeight
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length)
  const visibleItems = items.slice(startIndex, endIndex)
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 1.3 Asset Optimization
```typescript
// src/lib/assets.ts
export const imageOptimization = {
  // Preload critical images
  preloadImages: [
    '/images/logo.webp',
    '/images/hero-background.webp'
  ],
  
  // Image component with optimization
  OptimizedImage: ({ src, alt, priority = false, ...props }) => (
    <Image
      src={src}
      alt={alt}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT+wCNLFzCZCbfUd8rTDUWgbbeCDGpRoXtWgOHwMOA9hWaT/Z"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  )
}
```

## 2. Backend Performance Optimization

### 2.1 Database Query Optimization
```typescript
// src/lib/database-performance.ts
import { db } from './database'

export const optimizedQueries = {
  // Use prepared statements
  getUserScenarios: async (userId: string, limit: number = 20) => {
    return await db.raw(`
      SELECT s.*, us.completed_at, us.score
      FROM scenarios s
      LEFT JOIN user_sessions us ON s.id = us.scenario_id AND us.user_id = ?
      WHERE s.target_profession = (SELECT profession FROM users WHERE id = ?)
      ORDER BY s.created_at DESC
      LIMIT ?
    `, [userId, userId, limit])
  },

  // Batch operations
  batchUpdateProgress: async (updates: Array<{userId: string, scenarioId: string, progress: number}>) => {
    const query = db('user_progress')
    
    for (const update of updates) {
      query.insert({
        user_id: update.userId,
        scenario_id: update.scenarioId,
        progress: update.progress,
        updated_at: new Date()
      }).onConflict(['user_id', 'scenario_id']).merge(['progress', 'updated_at'])
    }
    
    return await query
  },

  // Connection pooling configuration
  connectionConfig: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  }
}
```

### 2.2 Caching Strategy Implementation
```typescript
// src/lib/cache.ts
import Redis from 'ioredis'

export class CacheManager {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })
  }

  // Cache TTL configurations
  private readonly TTL = {
    user_session: 3600, // 1 hour
    scenario_list: 1800, // 30 minutes
    feedback_report: 86400, // 24 hours
    user_progress: 300, // 5 minutes
    ai_response: 1800 // 30 minutes
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, type: keyof typeof this.TTL): Promise<void> {
    try {
      await this.redis.setex(key, this.TTL[type], JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  // Cache-aside pattern implementation
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    type: keyof typeof this.TTL
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached) return cached

    const fresh = await fetcher()
    await this.set(key, fresh, type)
    return fresh
  }
}

export const cache = new CacheManager()
```

### 2.3 API Response Optimization
```typescript
// src/lib/api-optimization.ts
import compression from 'compression'
import { cache } from './cache'

export const apiOptimizations = {
  // Response compression middleware
  compressionMiddleware: compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false
      return compression.filter(req, res)
    }
  }),

  // Response caching wrapper
  withCache: (type: keyof typeof cache.TTL) => {
    return (handler: Function) => {
      return async (req: any, res: any) => {
        const cacheKey = `api:${req.method}:${req.url}:${JSON.stringify(req.query)}`
        
        if (req.method === 'GET') {
          const cached = await cache.get(cacheKey)
          if (cached) {
            res.setHeader('X-Cache', 'HIT')
            return res.json(cached)
          }
        }

        const result = await handler(req, res)
        
        if (req.method === 'GET' && res.statusCode === 200) {
          await cache.set(cacheKey, result, type)
          res.setHeader('X-Cache', 'MISS')
        }

        return result
      }
    }
  },

  // Pagination helper
  paginate: (query: any, page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit
    return query.limit(limit).offset(offset)
  },

  // Response formatting
  formatResponse: (data: any, meta?: any) => ({
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  })
}
```

## 3. Real-time Performance Optimization

### 3.1 WebSocket Connection Management
```typescript
// src/lib/websocket-performance.ts
export class WebSocketManager {
  private connections = new Map<string, WebSocket>()
  private heartbeatInterval = 30000 // 30 seconds
  private reconnectDelay = 1000

  optimizeConnection(ws: WebSocket, userId: string) {
    // Enable compression
    ws.binaryType = 'arraybuffer'
    
    // Set up heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    }, this.heartbeatInterval)

    // Connection cleanup
    ws.on('close', () => {
      clearInterval(heartbeat)
      this.connections.delete(userId)
    })

    // Message batching for high-frequency updates
    const messageQueue: any[] = []
    let batchTimeout: NodeJS.Timeout

    const flushMessages = () => {
      if (messageQueue.length > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'batch', messages: messageQueue }))
        messageQueue.length = 0
      }
    }

    const queueMessage = (message: any) => {
      messageQueue.push(message)
      
      if (batchTimeout) clearTimeout(batchTimeout)
      batchTimeout = setTimeout(flushMessages, 100) // Batch every 100ms
    }

    this.connections.set(userId, ws)
    return { queueMessage, flushMessages }
  }
}
```

### 3.2 Audio Processing Optimization
```typescript
// src/lib/audio-performance.ts
export class AudioProcessor {
  private audioContext: AudioContext
  private workletNode: AudioWorkletNode | null = null

  async initialize() {
    this.audioContext = new AudioContext({
      sampleRate: 16000, // Optimized for speech
      latencyHint: 'interactive'
    })

    // Load audio worklet for better performance
    await this.audioContext.audioWorklet.addModule('/audio-processor-worklet.js')
    
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor')
  }

  optimizeForSpeech(stream: MediaStream) {
    const source = this.audioContext.createMediaStreamSource(stream)
    
    // Apply noise suppression
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = 1.5

    // High-pass filter to remove low-frequency noise
    const highpassFilter = this.audioContext.createBiquadFilter()
    highpassFilter.type = 'highpass'
    highpassFilter.frequency.value = 80

    // Connect processing chain
    source.connect(highpassFilter)
    highpassFilter.connect(gainNode)
    gainNode.connect(this.workletNode!)
    
    return this.workletNode!
  }

  // Buffer management for real-time processing
  private audioBuffers = new Map<string, Float32Array[]>()
  private maxBufferSize = 10 // Maximum 10 chunks

  addAudioChunk(sessionId: string, chunk: Float32Array) {
    if (!this.audioBuffers.has(sessionId)) {
      this.audioBuffers.set(sessionId, [])
    }

    const buffers = this.audioBuffers.get(sessionId)!
    buffers.push(chunk)

    // Remove old chunks to prevent memory bloat
    if (buffers.length > this.maxBufferSize) {
      buffers.shift()
    }
  }
}
```

## 4. Monitoring and Performance Metrics

### 4.1 Performance Monitoring Setup
```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics() {
    const summary = new Map<string, any>()
    
    for (const [name, values] of this.metrics) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
      
      summary.set(name, { avg, min, max, p95, count: values.length })
    }
    
    return Object.fromEntries(summary)
  }

  // Middleware for API response time monitoring
  responseTimeMiddleware = (req: any, res: any, next: any) => {
    const start = Date.now()
    
    res.on('close', () => {
      const duration = Date.now() - start
      this.recordMetric(`api.${req.method}.${req.route?.path || req.path}`, duration)
    })
    
    next()
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

### 4.2 Frontend Performance Tracking
```typescript
// src/lib/client-performance.ts
export const clientPerformance = {
  // Core Web Vitals tracking
  trackWebVitals: () => {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('LCP:', entry.startTime)
        // Send to analytics
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime)
        // Send to analytics
      }
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('CLS:', entry.value)
          // Send to analytics
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
  },

  // Custom performance marks
  mark: (name: string) => {
    performance.mark(name)
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name, 'measure')[0]
    console.log(`${name}: ${measure.duration}ms`)
    return measure.duration
  }
}
```

## 5. Database Performance Optimization

### 5.1 Index Strategy
```sql
-- Database indexes for optimal query performance
-- scenarios table indexes
CREATE INDEX CONCURRENTLY idx_scenarios_profession_difficulty 
ON scenarios (target_profession, difficulty_level);

CREATE INDEX CONCURRENTLY idx_scenarios_clinical_area 
ON scenarios (clinical_area) WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_scenarios_created_at 
ON scenarios (created_at DESC);

-- sessions table indexes
CREATE INDEX CONCURRENTLY idx_sessions_user_id_created_at 
ON sessions (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_sessions_scenario_id 
ON sessions (scenario_id) WHERE status = 'completed';

-- user_progress indexes
CREATE INDEX CONCURRENTLY idx_user_progress_user_scenario 
ON user_progress (user_id, scenario_id);

CREATE INDEX CONCURRENTLY idx_user_progress_updated_at 
ON user_progress (updated_at DESC);

-- feedback_reports indexes
CREATE INDEX CONCURRENTLY idx_feedback_reports_session_id 
ON feedback_reports (session_id);

CREATE INDEX CONCURRENTLY idx_feedback_reports_user_scores 
ON feedback_reports (user_id, overall_score DESC);
```

### 5.2 Query Optimization Patterns
```typescript
// src/lib/query-optimization.ts
export const optimizedQueries = {
  // Use SELECT only needed columns
  getScenariosList: async (userId: string, filters: any) => {
    return await db('scenarios')
      .select([
        'id', 'title', 'description', 'difficulty_level', 
        'duration_minutes', 'clinical_area'
      ])
      .where('target_profession', '=', 
        db.select('profession').from('users').where('id', userId)
      )
      .where('status', 'published')
      .modify((query) => {
        if (filters.difficulty) {
          query.where('difficulty_level', filters.difficulty)
        }
        if (filters.clinical_area) {
          query.where('clinical_area', filters.clinical_area)
        }
      })
      .orderBy('created_at', 'desc')
      .limit(20)
  },

  // Use EXISTS instead of JOIN for better performance
  getUsersWithCompletedSessions: async () => {
    return await db('users')
      .select('id', 'email', 'full_name')
      .whereExists(function() {
        this.select('*')
          .from('sessions')
          .whereRaw('sessions.user_id = users.id')
          .where('status', 'completed')
      })
  },

  // Batch operations for better performance
  bulkInsertSessions: async (sessions: any[]) => {
    const batchSize = 100
    const batches = []
    
    for (let i = 0; i < sessions.length; i += batchSize) {
      batches.push(sessions.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      await db('sessions').insert(batch)
    }
  }
}
```