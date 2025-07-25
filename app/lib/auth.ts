
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

// Enhanced Clerk auth utility functions for production
export async function getServerSession() {
  const { userId } = await auth()
  if (!userId) return null
  
  const user = await currentUser()
  return { 
    user: { 
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: user?.publicMetadata?.role || user?.privateMetadata?.role || 'user'
    } 
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await currentUser()
  return { 
    user: { 
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: user?.publicMetadata?.role || user?.privateMetadata?.role || 'user'
    } 
  }
}

export async function requireAdmin() {
  const session = await requireAuth()
  const userRole = session.user.role
  
  if (userRole !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return session
}

export async function checkUserRole(requiredRole: string) {
  const session = await getServerSession()
  if (!session) return false
  
  const userRole = session.user.role
  
  // Admin has access to everything
  if (userRole === 'admin') return true
  
  // Check specific role
  return userRole === requiredRole
}

export async function getCurrentUserRole() {
  const session = await getServerSession()
  return session?.user?.role || null
}

// API route helper for authentication
export async function authenticateRequest() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  const user = await currentUser()
  return {
    userId,
    user: {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: user?.publicMetadata?.role || user?.privateMetadata?.role || 'user'
    }
  }
}

// API route helper for admin authentication
export async function authenticateAdmin() {
  const authData = await authenticateRequest()
  
  if (authData.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  
  return authData
}

// For backward compatibility with NextAuth patterns
export const authOptions = null // Not needed with Clerk
