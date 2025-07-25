import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from './user-session'

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
  
  if (message.includes('Unauthorized') || message.includes('Authentication')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
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

// Enhanced authentication check wrapper with user session
export async function requireAuth() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication required');
  }
}

// Check if user has specific role
export function requireRole(user: any, role: string) {
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (user.role !== role && user.role !== 'admin') {
    throw new Error(`Access denied. Required role: ${role}`);
  }
  
  return true;
}

// Get user context for API operations
export async function getUserContext() {
  const user = await getCurrentUser();
  
  return {
    user,
    userId: user?._id,
    userEmail: user?.email,
    userRole: user?.role,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
} 