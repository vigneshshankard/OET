# Third-Party Integration Error Handling Specification

Version: 1.0  
Last Updated: September 24, 2025

## Overview
This document specifies exact error handling patterns for all third-party service integrations to eliminate developer assumptions about edge cases.

## 1. Hugging Face API Integration

### 1.1 Error Scenarios and Responses
```typescript
// src/lib/huggingface-client.ts
export class HuggingFaceError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'HuggingFaceError'
  }
}

export const HUGGINGFACE_ERROR_CODES = {
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'REQUEST_TIMEOUT',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  INVALID_INPUT: 'INVALID_INPUT',
  AUTHENTICATION: 'AUTHENTICATION_FAILED',
  NETWORK: 'NETWORK_ERROR'
} as const

export async function handleHuggingFaceResponse(response: Response): Promise<any> {
  // Rate limiting (429)
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '60'
    throw new HuggingFaceError(
      HUGGINGFACE_ERROR_CODES.RATE_LIMIT,
      429,
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      true
    )
  }

  // Model loading (503)
  if (response.status === 503) {
    const errorData = await response.json().catch(() => ({}))
    throw new HuggingFaceError(
      HUGGINGFACE_ERROR_CODES.MODEL_UNAVAILABLE,
      503,
      'Model is currently loading. Please retry in 20 seconds',
      true
    )
  }

  // Authentication (401)
  if (response.status === 401) {
    throw new HuggingFaceError(
      HUGGINGFACE_ERROR_CODES.AUTHENTICATION,
      401,
      'Invalid Hugging Face API key',
      false
    )
  }

  // Bad request (400)
  if (response.status === 400) {
    const errorData = await response.json().catch(() => ({}))
    throw new HuggingFaceError(
      HUGGINGFACE_ERROR_CODES.INVALID_INPUT,
      400,
      `Invalid input: ${errorData.error || 'Malformed request'}`,
      false
    )
  }

  // Server errors (5xx)
  if (response.status >= 500) {
    throw new HuggingFaceError(
      HUGGINGFACE_ERROR_CODES.NETWORK,
      response.status,
      'Hugging Face service temporarily unavailable',
      true
    )
  }

  return response.json()
}
```

### 1.2 Retry Logic with Exponential Backoff
```typescript
export async function callHuggingFaceWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: HuggingFaceError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as HuggingFaceError
      
      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
```

### 1.3 Fallback Responses
```typescript
export const FALLBACK_PATIENT_RESPONSES = {
  default: "I understand. Could you please explain that in more detail?",
  confused: "I'm sorry, I didn't quite understand. Could you repeat that?",
  concerned: "That sounds concerning. What should I do about it?",
  grateful: "Thank you for explaining that to me, doctor."
}

export const FALLBACK_FEEDBACK_TEMPLATE = {
  clinical_communication: 75,
  empathy: 70,
  language_accuracy: 80,
  overall_feedback: "System temporarily unavailable. Please try again later.",
  strengths: ["Professional interaction maintained"],
  improvements: ["System evaluation pending - please retry session"]
}
```

## 2. Stripe Integration

### 2.1 Payment Error Scenarios
```typescript
export class StripeError extends Error {
  constructor(
    public code: string,
    public type: string,
    message: string,
    public declineCode?: string
  ) {
    super(message)
    this.name = 'StripeError'
  }
}

export async function handleStripeError(error: any): Promise<never> {
  // Card declined
  if (error.code === 'card_declined') {
    throw new StripeError(
      error.code,
      'card_error',
      'Your card was declined. Please try a different payment method.',
      error.decline_code
    )
  }

  // Insufficient funds
  if (error.code === 'insufficient_funds') {
    throw new StripeError(
      error.code,
      'card_error',
      'Your card has insufficient funds. Please try a different payment method.'
    )
  }

  // Expired card
  if (error.code === 'expired_card') {
    throw new StripeError(
      error.code,
      'card_error',
      'Your card has expired. Please update your payment information.'
    )
  }

  // Rate limiting
  if (error.code === 'rate_limit') {
    throw new StripeError(
      error.code,
      'rate_limit_error',
      'Too many requests. Please try again in a few seconds.'
    )
  }

  // Generic error
  throw new StripeError(
    error.code || 'unknown',
    error.type || 'api_error',
    error.message || 'An unexpected error occurred with payment processing.'
  )
}
```

### 2.2 Webhook Error Handling
```typescript
export async function handleStripeWebhook(
  signature: string,
  payload: string,
  maxRetries: number = 3
): Promise<void> {
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }

  // Process with retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processStripeEvent(event)
      return
    } catch (error) {
      console.error(`Webhook processing attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        // Log for manual review
        await logFailedWebhook(event, error)
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

## 3. WebRTC/LiveKit Integration

### 3.1 Connection Error Handling
```typescript
export class LiveKitError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean = false
  ) {
    super(message)
    this.name = 'LiveKitError'
  }
}

export const liveKitErrorHandler = {
  // Connection failed
  ConnectionError: (error: any) => {
    return new LiveKitError(
      'CONNECTION_FAILED',
      'Unable to connect to audio service. Please check your internet connection.',
      true
    )
  },

  // Permission denied
  NotAllowedError: (error: any) => {
    return new LiveKitError(
      'MICROPHONE_PERMISSION_DENIED',
      'Microphone access is required for practice sessions. Please allow microphone permissions.',
      false
    )
  },

  // Device not found
  NotFoundError: (error: any) => {
    return new LiveKitError(
      'MICROPHONE_NOT_FOUND',
      'No microphone detected. Please connect a microphone and try again.',
      false
    )
  },

  // Network issues
  NetworkError: (error: any) => {
    return new LiveKitError(
      'NETWORK_ERROR',
      'Network connection is unstable. The session will automatically reconnect.',
      true
    )
  }
}
```

### 3.2 Auto-reconnection Logic
```typescript
export class LiveKitReconnectionManager {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  async handleDisconnection(reason: string): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new LiveKitError(
        'MAX_RECONNECTION_ATTEMPTS',
        'Unable to maintain connection to audio service. Please refresh and try again.',
        false
      )
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await this.attemptReconnection()
      this.reconnectAttempts = 0 // Reset on successful connection
    } catch (error) {
      await this.handleDisconnection(reason)
    }
  }
}
```

## 4. Database Integration

### 4.1 Connection Error Handling
```typescript
export class DatabaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public query?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export async function handleDatabaseError(error: any, query?: string): Promise<never> {
  // Connection timeout
  if (error.code === 'ETIMEDOUT') {
    throw new DatabaseError(
      'CONNECTION_TIMEOUT',
      'Database connection timed out. Please try again.',
      query
    )
  }

  // Connection refused
  if (error.code === 'ECONNREFUSED') {
    throw new DatabaseError(
      'CONNECTION_REFUSED',
      'Unable to connect to database. Service temporarily unavailable.',
      query
    )
  }

  // Unique constraint violation
  if (error.code === '23505') {
    throw new DatabaseError(
      'DUPLICATE_ENTRY',
      'This record already exists.',
      query
    )
  }

  // Foreign key constraint
  if (error.code === '23503') {
    throw new DatabaseError(
      'INVALID_REFERENCE',
      'Referenced record does not exist.',
      query
    )
  }

  // Generic database error
  throw new DatabaseError(
    error.code || 'UNKNOWN',
    error.message || 'Database operation failed.',
    query
  )
}
```

## 5. Error Response Patterns

### 5.1 API Error Response Format
```typescript
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    retryable: boolean
    retryAfter?: number
  }
  timestamp: string
  requestId: string
}

export function formatErrorResponse(error: Error, requestId: string): ApiErrorResponse {
  const isRetryable = error instanceof HuggingFaceError ? error.retryable :
                     error instanceof LiveKitError ? error.recoverable :
                     false

  return {
    error: {
      code: (error as any).code || 'INTERNAL_ERROR',
      message: error.message,
      retryable: isRetryable,
      retryAfter: isRetryable ? 30 : undefined
    },
    timestamp: new Date().toISOString(),
    requestId
  }
}
```

### 5.2 Frontend Error Handling
```typescript
export const errorMessages = {
  HUGGINGFACE_ERROR_CODES.RATE_LIMIT: 'AI service is busy. Please wait a moment and try again.',
  HUGGINGFACE_ERROR_CODES.MODEL_UNAVAILABLE: 'AI model is loading. Please try again in 20 seconds.',
  STRIPE_CARD_DECLINED: 'Payment was declined. Please try a different payment method.',
  LIVEKIT_CONNECTION_FAILED: 'Audio connection failed. Please check your internet connection.',
  DATABASE_TIMEOUT: 'Service is temporarily slow. Please try again.'
}
```