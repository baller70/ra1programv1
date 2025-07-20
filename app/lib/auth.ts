
import { auth } from '@clerk/nextjs/server'

// Clerk auth utility functions
export async function getServerSession() {
  const { userId } = await auth()
  return userId ? { user: { id: userId } } : null
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return { user: { id: userId } }
}

// For backward compatibility with NextAuth patterns
export const authOptions = null // Not needed with Clerk
