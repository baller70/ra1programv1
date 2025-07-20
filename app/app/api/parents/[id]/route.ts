
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
// Clerk auth
import { prisma } from '../../../../lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Temporarily disabled for testing: await requireAuth()
    

    const parent = await prisma.parent.findUnique({
      where: { id: params.id },
      include: {
        paymentPlans: {
          include: {
            payments: true
          }
        },
        payments: {
          orderBy: {
            dueDate: 'desc'
          }
        },
        messageLogs: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    return NextResponse.json(parent)
  } catch (error) {
    console.error('Parent fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent' },
      { status: 500 }
    )
  }
}
