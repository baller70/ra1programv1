import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { convexHttp } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const { id } = evt.data
  const eventType = evt.type

  try {
    switch (eventType) {
      case 'user.created':
        // Create user in Convex database
        await convexHttp.mutation(api.users.getOrCreateUser, {
          clerkId: id,
          email: evt.data.email_addresses[0]?.email_address || '',
          firstName: evt.data.first_name || '',
          lastName: evt.data.last_name || '',
          role: evt.data.public_metadata?.role || 'user'
        })
        console.log(`User created: ${id}`)
        break

      case 'user.updated':
        // Update user in Convex database
        await convexHttp.mutation(api.users.updateUser, {
          clerkId: id,
          email: evt.data.email_addresses[0]?.email_address,
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          role: evt.data.public_metadata?.role || 'user'
        })
        console.log(`User updated: ${id}`)
        break

      case 'user.deleted':
        // Soft delete user in Convex database
        await convexHttp.mutation(api.users.updateUser, {
          clerkId: id,
          isActive: false
        })
        console.log(`User deleted: ${id}`)
        break

      case 'session.created':
        // Log user session
        await convexHttp.mutation(api.users.createUserSession, {
          clerkId: id,
          sessionData: {
            loginTime: new Date().toISOString(),
            userAgent: req.headers.get('user-agent') || '',
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
          }
        })
        console.log(`Session created for user: ${id}`)
        break

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${eventType} processed successfully` 
    })

  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
} 