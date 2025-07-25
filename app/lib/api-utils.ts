import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest, authenticateAdmin } from './auth'

// Enhanced error handling for API routes
export function handleError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const contextInfo = context ? ` in ${context}` : ''
  
  console.error(`API Error${contextInfo}:`, error)
  
  // Return appropriate HTTP status based on error type
  if (message.includes('not found') || message.includes('Not found')) {
    return NextResponse.json(
      { error: `Resource not found${contextInfo}` },
      { status: 404 }
    )
  }
  
  if (message.includes('Unauthorized') || message.includes('Authentication required')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  if (message.includes('Forbidden') || message.includes('Admin access required')) {
    return NextResponse.json(
      { error: 'Access denied: Insufficient permissions' },
      { status: 403 }
    )
  }
  
  if (message.includes('validation') || message.includes('Invalid')) {
    return NextResponse.json(
      { error: `Validation error${contextInfo}: ${message}` },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: `Server error${contextInfo}` },
    { status: 500 }
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