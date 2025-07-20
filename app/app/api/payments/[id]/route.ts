
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { requireAuth } from '../../../../lib/api-utils'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const payment = await prisma.payment.findUnique({
      where: {
        id: params.id
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
            installmentAmount: true,
            description: true,
          },
        },
        reminders: {
          select: {
            id: true,
            reminderType: true,
            scheduledFor: true,
            status: true,
          },
          orderBy: { scheduledFor: 'desc' },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Fetch contracts for the parent
    const contracts = await prisma.contract.findMany({
      where: {
        parentId: payment.parent.id
      },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        status: true,
        uploadedAt: true,
        signedAt: true,
        expiresAt: true,
        templateType: true,
        version: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    return NextResponse.json({
      ...payment,
      parent: {
        ...payment.parent,
        contracts: contracts
      }
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const body = await request.json()
    const { status, paidAt, notes } = body

    const payment = await prisma.payment.update({
      where: {
        id: params.id
      },
      data: {
        ...(status && { status }),
        ...(paidAt && { paidAt: new Date(paidAt) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
            installmentAmount: true,
            description: true,
          },
        },
        reminders: {
          select: {
            id: true,
            reminderType: true,
            scheduledFor: true,
            status: true,
          },
          orderBy: { scheduledFor: 'desc' },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    

    const payment = await prisma.payment.findUnique({
      where: { id: params.id }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete paid payment' },
        { status: 400 }
      )
    }

    await prisma.payment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}
