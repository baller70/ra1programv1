import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest, authenticateAdmin } from './auth'

// API Error types
export const ApiErrors = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const

// Create success response helper
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

// Create error response helper  
export function createErrorResponse(error: string, status: number = 500, code?: string) {
  return NextResponse.json(
    { 
      error,
      code: code || ApiErrors.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// Check if error is database-related
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('database') || 
           message.includes('connection') || 
           message.includes('timeout') ||
           message.includes('constraint') ||
           message.includes('unique') ||
           message.includes('foreign key')
  }
  return false
}

// Enhanced error handling for API routes
export function handleError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const contextInfo = context ? ` in ${context}` : ''
  
  console.error(`API Error${contextInfo}:`, error)
  
  // Check for database errors first
  if (isDatabaseError(error)) {
    return createErrorResponse(
      `Database error${contextInfo}`,
      500,
      ApiErrors.DATABASE_ERROR
    )
  }
  
  // Return appropriate HTTP status based on error type
  if (message.includes('not found') || message.includes('Not found')) {
    return createErrorResponse(
      `Resource not found${contextInfo}`,
      404,
      ApiErrors.NOT_FOUND
    )
  }
  
  if (message.includes('Unauthorized') || message.includes('Authentication required')) {
    return createErrorResponse(
      'Authentication required',
      401,
      ApiErrors.UNAUTHORIZED
    )
  }
  
  if (message.includes('Forbidden') || message.includes('Admin access required')) {
    return createErrorResponse(
      'Access denied: Insufficient permissions',
      403,
      ApiErrors.FORBIDDEN
    )
  }
  
  if (message.includes('validation') || message.includes('Invalid')) {
    return createErrorResponse(
      `Validation error${contextInfo}: ${message}`,
      400,
      ApiErrors.VALIDATION_ERROR
    )
  }

  if (message.includes('Rate limit')) {
    return createErrorResponse(
      'Rate limit exceeded. Please try again later.',
      429,
      ApiErrors.RATE_LIMIT
    )
  }
  
  return createErrorResponse(
    `Server error${contextInfo}`,
    500,
    ApiErrors.INTERNAL_ERROR
  )
}

// Validate request body against schema
export function validateRequest<T>(data: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.issues.map(i => i.message).join(', ')}`)
  }
  return result.data
}

// Production authentication check using Clerk
export async function requireAuth() {
  try {
    const authData = await authenticateRequest()
    return authData.user
  } catch (error) {
    console.error('Authentication error:', error)
    throw new Error('Authentication required')
  }
}

// Check if user has admin role
export async function requireAdmin() {
  try {
    const authData = await authenticateAdmin()
    return authData.user
  } catch (error) {
    console.error('Admin authentication error:', error)
    throw error // Re-throw to preserve specific error message
  }
}

// Check if user has specific role
export function requireRole(user: any, role: string) {
  if (!user) {
    throw new Error('Authentication required')
  }
  
  // Admin has access to everything
  if (user.role === 'admin') {
    return true
  }
  
  if (user.role !== role) {
    throw new Error(`Access denied. Required role: ${role}`)
  }
  
  return true
}

// Get user context for API operations with Clerk authentication
export async function getUserContext() {
  try {
    const authData = await authenticateRequest()
    const user = authData.user
    
    return {
      user,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
    }
  } catch (error) {
    return {
      user: null,
      userId: null,
      userEmail: null,
      userRole: null,
      isAuthenticated: false,
      isAdmin: false,
    }
  }
}

// Rate limiting helper (to be implemented with Redis in production)
export function createRateLimiter(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map()
  
  return (identifier: string) => {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      requests.set(key, timestamps.filter((t: number) => t > windowStart))
      if (requests.get(key).length === 0) {
        requests.delete(key)
      }
    }
    
    // Check current requests
    const userRequests = requests.get(identifier) || []
    if (userRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    // Add current request
    userRequests.push(now)
    requests.set(identifier, userRequests)
    
    return true
  }
} 