
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/db';

const bulkSendSchema = z.object({
  parentIds: z.array(z.string()),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  channel: z.enum(['email', 'sms']).default('email'),
  messageType: z.enum(['payment_reminder', 'welcome', 'custom']).default('custom'),
  customizePerParent: z.boolean().default(true),
});

// Helper function for error handling
function handleError(error: any, message: string) {
  console.error(message, error);
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid data', details: error.errors },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkSendSchema.parse(body);

    const { parentIds, templateId, subject, body: messageBody, channel, messageType, customizePerParent } = validatedData;

    if (parentIds.length === 0) {
      return NextResponse.json({ error: 'Parent IDs are required' }, { status: 400 });
    }

    if (messageType === 'custom' && (!subject || !messageBody)) {
      return NextResponse.json({ error: 'Subject and body are required for custom messages' }, { status: 400 });
    }

    // Get parent information
    const parents = await prisma.parent.findMany({
      where: {
        id: { in: parentIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    if (parents.length === 0) {
      return NextResponse.json({ error: 'No valid parents found' }, { status: 400 });
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await prisma.template.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
    }

    const results = [];
    const messageLogs = [];

    // Process each parent
    for (const parent of parents) {
      try {
        let personalizedSubject = subject || template?.subject || 'Message from Rise as One';
        let personalizedBody = messageBody || template?.body || '';

        if (customizePerParent) {
          // Replace template variables
          personalizedSubject = personalizedSubject.replace(/\{parentName\}/g, parent.name || 'Parent');
          personalizedSubject = personalizedSubject.replace(/\{parentEmail\}/g, parent.email);
          
          personalizedBody = personalizedBody.replace(/\{parentName\}/g, parent.name || 'Parent');
          personalizedBody = personalizedBody.replace(/\{parentEmail\}/g, parent.email);
          personalizedBody = personalizedBody.replace(/\{parentPhone\}/g, parent.phone || 'N/A');
        }

        // Create message log (simulating email send for now)
        const messageLog = await prisma.messageLog.create({
          data: {
            parentId: parent.id,
            templateId: templateId || null,
            subject: personalizedSubject,
            body: personalizedBody,
            channel,
            status: 'sent', // Simulating successful send
            sentAt: new Date(),
            metadata: {
              messageType,
              simulatedSend: true, // Flag to indicate this was simulated
            },
          },
        });

        messageLogs.push(messageLog);
        results.push({
          parentId: parent.id,
          parentName: parent.name,
          parentEmail: parent.email,
          success: true,
          messageId: messageLog.id,
          message: `Message logged successfully (${channel} integration coming soon)`,
        });

      } catch (error) {
        console.error(`Error processing parent ${parent.id}:`, error);
        results.push({
          parentId: parent.id,
          parentName: parent.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Update template usage count if template was used
    if (templateId && template) {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: results.filter(r => r.success).length
          }
        }
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      total: parentIds.length,
      successful,
      failed,
      results,
      messageLogs: messageLogs.map(log => ({
        id: log.id,
        parentId: log.parentId,
        status: log.status,
        sentAt: log.sentAt,
        subject: log.subject,
      })),
      summary: {
        total: parentIds.length,
        successful,
        failed,
      },
      message: `Processed ${successful} messages successfully via ${channel} (integration ready for activation)`,
    });

  } catch (error) {
    return handleError(error, 'Failed to send bulk communications');
  }
}
