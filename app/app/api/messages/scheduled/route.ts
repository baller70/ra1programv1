
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
// Clerk auth
import { prisma } from '../../../../lib/db'

export async function GET() {
  try {
    await requireAuth()
    

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      include: {
        template: true
      },
      orderBy: { scheduledFor: 'asc' }
    })

    // Add recipient details
    const messagesWithRecipients = await Promise.all(
      scheduledMessages.map(async (message) => {
        let recipients: { id: string; name: string; email: string }[] = []
        try {
          const recipientIds = JSON.parse(message.recipients) as string[]
          if (Array.isArray(recipientIds) && recipientIds.length > 0) {
            const recipientPromises = recipientIds.map(id => 
              prisma.parent.findUnique({
                where: { id },
                select: { id: true, name: true, email: true }
              })
            )
            const recipientResults = await Promise.all(recipientPromises)
            recipients = recipientResults.filter(r => r !== null) as { id: string; name: string; email: string }[]
          }
        } catch (error) {
          console.error('Error parsing recipients:', error)
          recipients = []
        }

        return {
          ...message,
          recipientDetails: recipients
        }
      })
    )

    return NextResponse.json(messagesWithRecipients)
  } catch (error) {
    console.error('Scheduled messages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled messages' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuth()
    

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    await prisma.scheduledMessage.update({
      where: { id: messageId },
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel scheduled message error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel scheduled message' },
      { status: 500 }
    )
  }
}
