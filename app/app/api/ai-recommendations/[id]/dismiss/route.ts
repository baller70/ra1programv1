
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/api-utils'
import { prisma } from '../../../../../lib/db'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { reason, feedback } = body

    const recommendation = await prisma.aIRecommendation.update({
      where: { id: params.id },
      data: {
        dismissedAt: new Date(),
        dismissedBy: user.user.id,
        dismissReason: reason || 'User dismissed',
        feedback: feedback || null
      }
    })

    return NextResponse.json({
      success: true,
      recommendation
    })

  } catch (error) {
    console.error('AI recommendation dismissal error:', error)
    return NextResponse.json(
      { error: 'Failed to dismiss AI recommendation' },
      { status: 500 }
    )
  }
}
