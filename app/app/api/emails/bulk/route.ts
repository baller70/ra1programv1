import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { emailService } from '../../../../lib/resend'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface EmailResult {
  to: string
  messageId?: string
  status: 'sent' | 'failed'
  error?: string
}

export async function POST(request: Request) {
  try {
    await requireAuth()
    
    const body = await request.json()
    const { type, recipients, delay = 1000 } = body // delay between emails to avoid rate limits

    if (!type || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Email type and recipients array are required' },
        { status: 400 }
      )
    }

    const results = {
      successful: [] as EmailResult[],
      failed: [] as EmailResult[],
      total: recipients.length
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      const { to, data } = recipient

      try {
        let result

        switch (type) {
          case 'payment_reminder':
            const { parentName, studentName, amount, dueDate } = data
            result = await emailService.sendPaymentReminder(to, parentName, studentName, amount, dueDate)
            break

          case 'overdue_notice':
            const { parentName: parentNameOverdue, studentName: studentNameOverdue, amount: amountOverdue, daysPastDue } = data
            result = await emailService.sendOverdueNotice(to, parentNameOverdue, studentNameOverdue, amountOverdue, daysPastDue)
            break

          case 'custom':
            const { subject, htmlContent, from } = data
            result = await emailService.sendCustomEmail(to, subject, htmlContent, from)
            break

          default:
            throw new Error('Invalid email type')
        }

        results.successful.push({
          to,
          messageId: result.data?.id,
          status: 'sent'
        })

      } catch (error) {
        console.error(`Failed to send email to ${to}:`, error)
        results.failed.push({
          to,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        })
      }

      // Add delay between emails to avoid rate limiting
      if (i < recipients.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Log bulk email operation
    try {
      // You can add bulk email logging here if needed
      console.log(`Bulk email operation completed: ${results.successful.length} successful, ${results.failed.length} failed`)
    } catch (logError) {
      console.error('Failed to log bulk email operation:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Bulk email operation completed: ${results.successful.length}/${results.total} emails sent successfully`,
      results
    })

  } catch (error) {
    console.error('Error in bulk email operation:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk email operation' },
      { status: 500 }
    )
  }
} 