
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/api-utils'
// Clerk auth
import { prisma } from '../../../lib/db'

export async function GET(request: Request) {
  try {
    await requireAuth()
    

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (parentId) {
      where.parentId = parentId
    }

    if (channel) {
      where.channel = channel
    }

    if (status) {
      where.status = status
    }

    const messages = await prisma.messageLog.findMany({
      where,
      include: {
        parent: true,
        template: true
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.messageLog.count({ where })

    return NextResponse.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Temporarily disabled for testing: await requireAuth()
    

    const body = await request.json()
    
    // Handle bulk AI-generated messages
    if (body.messages && Array.isArray(body.messages)) {
      const results = []
      
      for (const msg of body.messages) {
        try {
          const messageLog = await prisma.messageLog.create({
            data: {
              parentId: msg.parentId,
              subject: 'AI Generated Message',
              body: msg.message,
              channel: 'email',
              status: 'sent',
              sentAt: new Date(),
              metadata: {
                type: msg.type || 'ai_generated',
                parentEmail: msg.parentEmail,
                parentName: msg.parentName,
                sentBy: 'ai-system'
              }
            },
            include: {
              parent: true
            }
          })
          
          results.push({
            success: true,
            messageId: messageLog.id,
            parentId: msg.parentId,
            parentName: msg.parentName
          })
        } catch (error) {
          console.error(`Failed to send message to ${msg.parentName}:`, error)
          results.push({
            success: false,
            parentId: msg.parentId,
            parentName: msg.parentName,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      return NextResponse.json({
        success: true,
        totalMessages: body.messages.length,
        successCount,
        failCount,
        results
      })
    }

    // Original single message logic
    const {
      templateId,
      subject,
      body: messageBody,
      channel,
      recipients,
      scheduledFor,
      variables = {}
    } = body

    // If scheduled for future, create scheduled message
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      const scheduledMessage = await prisma.scheduledMessage.create({
        data: {
          templateId,
          subject,
          body: messageBody,
          channel,
          recipients,
          scheduledFor: new Date(scheduledFor),
          createdBy: 'system',
          metadata: { variables }
        }
      })

      return NextResponse.json({ 
        scheduled: true, 
        messageId: scheduledMessage.id 
      })
    }

    // Send immediately
    const results = []
    const errors = []

    for (const parentId of recipients) {
      try {
        // Get parent info for variable replacement
        const parent = await prisma.parent.findUnique({
          where: { id: parentId }
        })

        if (!parent) {
          errors.push(`Parent not found: ${parentId}`)
          continue
        }

        // Replace variables in subject and body
        let processedSubject = subject || ''
        let processedBody = messageBody || ''

        const templateVariables = {
          parentName: parent.name,
          parentEmail: parent.email,
          programName: 'Rise as One Yearly Program',
          ...variables
        }

        Object.entries(templateVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{${key}}`, 'g')
          processedSubject = processedSubject.replace(regex, String(value))
          processedBody = processedBody.replace(regex, String(value))
        })

        // Create message log
        const messageLog = await prisma.messageLog.create({
          data: {
            parentId,
            templateId,
            subject: processedSubject,
            body: processedBody,
            channel,
            status: 'sent', // In a real app, this would be 'pending' until actually sent
            sentAt: new Date(),
            metadata: { originalVariables: variables }
          }
        })

        // Update template usage count
        if (templateId) {
          await prisma.template.update({
            where: { id: templateId },
            data: { usageCount: { increment: 1 } }
          })
        }

        results.push({
          parentId,
          messageLogId: messageLog.id,
          status: 'sent'
        })

      } catch (error) {
        console.error(`Failed to send message to ${parentId}:`, error)
        errors.push(`Failed to send to parent ${parentId}`)
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      errors,
      messageLogIds: results.map(r => r.messageLogId)
    })

  } catch (error) {
    console.error('Message sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    )
  }
}
