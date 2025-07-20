import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily disabled for testing: await requireAuth()
    
    const paymentId = params.id

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Generate mock payment history for now
    // In a real app, you'd have a PaymentHistory or AuditLog table
    const history = [
      {
        id: '1',
        action: 'Payment Created',
        description: `Payment of $${payment.amount} was created and assigned to parent`,
        performedBy: 'System',
        performedAt: payment.createdAt || new Date().toISOString(),
        amount: payment.amount,
        status: 'pending'
      }
    ]

    // Add payment completion entry if paid
    if (payment.paidAt) {
      history.push({
        id: '2',
        action: 'Payment Completed',
        description: `Payment was marked as paid`,
        performedBy: 'System',
        performedAt: payment.paidAt,
        amount: payment.amount,
        status: 'paid'
      })
    }

    // Add reminder entries based on remindersSent count
    if (payment.remindersSent > 0) {
      for (let i = 1; i <= payment.remindersSent; i++) {
        history.push({
          id: `reminder-${i}`,
          action: `Reminder ${i} Sent`,
          description: `Payment reminder was sent to parent via email`,
          performedBy: 'System',
          performedAt: new Date(Date.now() - (payment.remindersSent - i + 1) * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
      }
    }

    // Add overdue status change if applicable
    if (payment.status === 'overdue') {
      const dueDate = new Date(payment.dueDate)
      const dayAfterDue = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
      
      history.push({
        id: 'overdue',
        action: 'Payment Overdue',
        description: `Payment became overdue after the due date passed`,
        performedBy: 'System',
        performedAt: dayAfterDue.toISOString(),
        status: 'overdue'
      })
    }

    // Sort history by date (newest first)
    history.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('Payment history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
} 