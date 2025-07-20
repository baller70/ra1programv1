import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Standard API error responses
export const ApiErrors = {
  UNAUTHORIZED: { error: 'Unauthorized', status: 401 },
  FORBIDDEN: { error: 'Forbidden', status: 403 },
  NOT_FOUND: { error: 'Not found', status: 404 },
  BAD_REQUEST: { error: 'Bad request', status: 400 },
  INTERNAL_ERROR: { error: 'Internal server error', status: 500 },
  DATABASE_ERROR: { error: 'Database connection failed', status: 503 },
  VALIDATION_ERROR: { error: 'Validation failed', status: 422 }
}

// Database connection error detection
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('prisma') ||
      message.includes('enotfound') ||
      message.includes('econnrefused')
    )
  }
  return false
}

// Consistent error response formatting
export function createErrorResponse(
  error: { error: string; status: number },
  details?: Record<string, any>
) {
  return NextResponse.json(
    { ...error, ...details },
    { status: error.status }
  )
}

// Success response formatting
export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

// Authentication check wrapper
export async function requireAuth() {
  // Temporarily disabled for development - return immediately
  return 'dev-user'
  
  // const { userId } = await auth()
  // 
  // if (!userId) {
  //   throw new Error('Unauthorized')
  // }
  // 
  // return userId
}

// Validate required fields
export function validateRequiredFields(data: Record<string, any>, fields: string[]) {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

// Safe JSON parsing
export function safeJsonParse(text: string, fallback = {}) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

// Rate limiting helper (basic implementation)
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map()
  
  return (identifier: string): boolean => {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const filtered = timestamps.filter((time: number) => time > windowStart)
      if (filtered.length === 0) {
        requests.delete(key)
      } else {
        requests.set(key, filtered)
      }
    }
    
    const userRequests = requests.get(identifier) || []
    const recentRequests = userRequests.filter((time: number) => time > windowStart)
    
    if (recentRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    recentRequests.push(now)
    requests.set(identifier, recentRequests)
    return true
  }
}

// Environment variable validation
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Handle API errors consistently
export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ApiErrors.UNAUTHORIZED)
    }
    if (isDatabaseError(error)) {
      return createErrorResponse(ApiErrors.DATABASE_ERROR)
    }
    return createErrorResponse(ApiErrors.INTERNAL_ERROR, { 
      message: error.message 
    })
  }
  
  return createErrorResponse(ApiErrors.INTERNAL_ERROR)
} 