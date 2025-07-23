import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { paymentMethod, cardLast4, paymentPlan } = await request.json()
    const paymentId = params.id

    // Get payment details
    const payment = await convex.query(api.payments.getPayment, { id: paymentId as any })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status to paid
    await convex.mutation(api.payments.updatePayment, {
      id: paymentId as any,
      status: 'paid',
      paidAt: Date.now()
    })

    // Create payment history entry
    await convex.mutation(api.payments.addPaymentHistory, {
      paymentId: paymentId as any,
      action: 'Payment Completed',
      description: `Full payment processed via ${paymentMethod} (****${cardLast4})`,
      performedBy: 'System',
      amount: payment.amount,
      status: 'paid'
    })

    return NextResponse.json({
      success: true,
      message: 'Payment completed successfully',
      paymentId: paymentId
    })

  } catch (error) {
    console.error('Error completing payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 