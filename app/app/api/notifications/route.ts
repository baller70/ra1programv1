export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getUserContext, handleError, validateRequest } from '../../../lib/api-utils'
import { convexHttp } from '../../../lib/db'
import { api } from '../../../convex/_generated/api'
import { z } from 'zod'

// Validation schemas
const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  parentId: z.string().optional(),
  paymentId: z.string().optional(),
  contractId: z.string().optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  expiresAt: z.number().optional(),
})

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()),
})

// GET /api/notifications - Get notifications
export async function GET(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeRead = searchParams.get('includeRead') === 'true'
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    // Get notifications
    const notifications = await convexHttp.query(api.notifications.getNotifications, {
      userId: userContext.userId as any,
      limit,
      includeRead,
      type: type || undefined,
      priority: priority || undefined,
    })

    // Get notification counts
    const counts = await convexHttp.query(api.notifications.getNotificationCounts, {
      userId: userContext.userId as any,
    })

    return NextResponse.json({
      notifications,
      counts,
      pagination: {
        limit,
        total: counts.total,
        unread: counts.unread,
      }
    })

  } catch (error) {
    console.error('Notifications fetch error:', error)
    return handleError(error)
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = validateRequest(body, createNotificationSchema)

    const notificationId = await convexHttp.mutation(api.notifications.createNotification, {
      ...validatedData,
      userId: userContext.userId as any,
      parentId: validatedData.parentId as any,
      paymentId: validatedData.paymentId as any,
      contractId: validatedData.contractId as any,
    })

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully'
    })

  } catch (error) {
    console.error('Notification creation error:', error)
    return handleError(error)
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'mark_all_read') {
      const markedCount = await convexHttp.mutation(api.notifications.markAllAsRead, {
        userId: userContext.userId as any,
      })

      return NextResponse.json({
        success: true,
        markedCount,
        message: `${markedCount} notifications marked as read`
      })
    }

    if (action === 'mark_read') {
      const validatedData = validateRequest(body, markAsReadSchema)
      
      await convexHttp.mutation(api.notifications.markMultipleAsRead, {
        notificationIds: validatedData.notificationIds as any,
      })

      return NextResponse.json({
        success: true,
        markedCount: validatedData.notificationIds.length,
        message: `${validatedData.notificationIds.length} notifications marked as read`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Notification update error:', error)
    return handleError(error)
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const userContext = await getUserContext()
    if (!userContext.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const action = searchParams.get('action')

    if (action === 'cleanup_expired') {
      const deletedCount = await convexHttp.mutation(api.notifications.cleanupExpiredNotifications, {})

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `${deletedCount} expired notifications cleaned up`
      })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    await convexHttp.mutation(api.notifications.deleteNotification, {
      notificationId: notificationId as any,
    })

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    console.error('Notification deletion error:', error)
    return handleError(error)
  }
} 