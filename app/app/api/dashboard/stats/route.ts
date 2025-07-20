
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { 
  requireAuth, 
  createErrorResponse, 
  createSuccessResponse, 
  isDatabaseError,
  ApiErrors 
} from '../../../../lib/api-utils'

export async function GET() {
  try {
    await requireAuth()

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Fetch all stats in parallel
    const [
      totalParents,
      totalRevenue,
      overduePayments,
      upcomingDues,
      activePaymentPlans,
      messagesSentThisMonth
    ] = await Promise.all([
      // Total active parents
      prisma.parent.count({
        where: { status: 'active' }
      }),

      // Total revenue from paid payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' }
      }),

      // Overdue payments count
      prisma.payment.count({
        where: { status: 'overdue' }
      }),

      // Upcoming dues (next 30 days)
      prisma.payment.count({
        where: {
          status: 'pending',
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Active payment plans
      prisma.paymentPlan.count({
        where: { status: 'active' }
      }),

      // Messages sent this month
      prisma.messageLog.count({
        where: {
          sentAt: {
            gte: startOfMonth,
            lt: startOfNextMonth
          }
        }
      })
    ])

    const stats = {
      totalParents,
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      overduePayments,
      upcomingDues,
      activePaymentPlans,
      messagesSentThisMonth
    }

    return createSuccessResponse(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createErrorResponse(ApiErrors.UNAUTHORIZED)
    }
    
    if (isDatabaseError(error)) {
      return createErrorResponse(ApiErrors.DATABASE_ERROR, {
        message: 'Please check database configuration',
        fallbackStats: {
          totalParents: 0,
          totalRevenue: 0,
          overduePayments: 0,
          upcomingDues: 0,
          activePaymentPlans: 0,
          messagesSentThisMonth: 0
        }
      })
    }
    
    return createErrorResponse(ApiErrors.INTERNAL_ERROR)
  }
}
