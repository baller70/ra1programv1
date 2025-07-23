import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { paymentPlan, installments, paymentMethod, cardLast4, customerEmail, customerName } = await request.json()
    const paymentId = params.id

    // Get payment details
    const payment = await convex.query(api.payments.getPayment, { id: paymentId as any })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Mark the current payment as paid (first installment)
    await convex.mutation(api.payments.updatePayment, {
      id: paymentId as any,
      status: 'paid',
      paidAt: Date.now()
    })

    // Create subscription record
    const subscriptionId = `sub_${Date.now()}_${paymentPlan}`
    
    // Create future payment entries for remaining installments
    const intervalMonths = paymentPlan === 'monthly' ? 1 : 3
    const currentDate = new Date()
    
    for (let i = 1; i < installments; i++) {
      const futureDate = new Date(currentDate)
      futureDate.setMonth(currentDate.getMonth() + (i * intervalMonths))
      
      await convex.mutation(api.payments.createPaymentRecord, {
        parentId: payment.parentId,
        amount: payment.amount || 0,
        dueDate: futureDate.getTime(),
        status: 'pending',
        paymentPlanId: payment.paymentPlanId || undefined,
        subscriptionId: subscriptionId,
        installmentNumber: i + 1,
        totalInstallments: installments
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscriptionId: subscriptionId,
      paymentId: paymentId,
      nextPaymentDate: new Date(currentDate.getTime() + (intervalMonths * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      remainingPayments: installments - 1
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 