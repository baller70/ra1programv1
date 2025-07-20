
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log webhook event
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        apiVersion: event.api_version,
        data: JSON.parse(JSON.stringify(event.data))
      }
    })
  } catch (error) {
    console.error('Failed to log webhook event:', error)
  }

  // Process the webhook event
  try {
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break
      
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
        break
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    // Mark event as processed
    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { 
        processed: true,
        processedAt: new Date()
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Mark event as failed
    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { 
        processed: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // This is typically handled when we create customers ourselves
  console.log('Customer created:', customer.id)
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  await prisma.stripeCustomer.updateMany({
    where: { stripeCustomerId: customer.id },
    data: {
      email: customer.email!,
      name: customer.name || null,
      phone: customer.phone || null,
      address: customer.address ? JSON.parse(JSON.stringify(customer.address)) : null,
      delinquent: customer.delinquent || false,
      balance: customer.balance || 0,
      defaultPaymentMethod: (customer as any).default_source as string || null
    }
  })
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: invoice.customer as string }
  })

  if (stripeCustomer) {
    await prisma.stripeInvoice.create({
      data: {
        stripeCustomerId: stripeCustomer.id,
        stripeInvoiceId: invoice.id!,
        subscriptionId: (invoice as any).subscription as string || null,
        status: (invoice.status as string) || 'draft',
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        amountRemaining: invoice.amount_remaining,
        currency: invoice.currency,
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url || null,
        invoicePdf: invoice.invoice_pdf || null,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
        metadata: invoice.metadata ? JSON.parse(JSON.stringify(invoice.metadata)) : null
      }
    })
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id)
  
  // Update invoice status
  await prisma.stripeInvoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: 'paid',
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      paidAt: new Date()
    }
  })

  // Find the parent associated with this Stripe customer
  const parent = await prisma.parent.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
    include: {
      payments: {
        where: {
          status: {
            in: ['pending', 'overdue']
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      },
      paymentPlans: true
    }
  })

  if (!parent) {
    console.log('No parent found for Stripe customer:', invoice.customer)
    return
  }

  console.log(`Found parent ${parent.name} with ${parent.payments.length} pending payments`)

  // Update the specific payment linked to this invoice
  const directPayment = await prisma.payment.findUnique({
    where: { stripeInvoiceId: invoice.id }
  })

  if (directPayment) {
    await prisma.payment.update({
      where: { id: directPayment.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentId: invoice.charge as string || null
      }
    })

    console.log(`Updated direct payment ${directPayment.id} to paid status`)
  }

  // If this is a subscription payment or bulk payment, 
  // apply the payment to the oldest pending payments
  const paidAmount = invoice.amount_paid / 100 // Convert from cents
  let remainingAmount = paidAmount

  for (const payment of parent.payments) {
    if (remainingAmount <= 0) break

    const paymentAmount = Number(payment.amount)
    
    if (remainingAmount >= paymentAmount) {
      // Full payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentId: invoice.charge as string || null
        }
      })

      remainingAmount -= paymentAmount
      console.log(`Marked payment ${payment.id} as paid ($${paymentAmount})`)
    } else {
      // Partial payment - create a new payment for the remaining amount
      const originalPayment = payment
      
      // Update original payment to paid with partial amount
      await prisma.payment.update({
        where: { id: originalPayment.id },
        data: {
          amount: remainingAmount,
          status: 'paid',
          paidAt: new Date(),
          stripePaymentId: invoice.charge as string || null
        }
      })

      // Create a new payment for the remaining balance
      const remainingBalance = paymentAmount - remainingAmount
      await prisma.payment.create({
        data: {
          parentId: parent.id,
          paymentPlanId: originalPayment.paymentPlanId,
          amount: remainingBalance,
          dueDate: originalPayment.dueDate,
          status: 'pending',
          notes: `Remaining balance from payment ${originalPayment.id}`
        }
      })

      remainingAmount = 0
      console.log(`Applied partial payment to ${payment.id} ($${remainingAmount})`)
      break
    }
  }

  // Update parent's Stripe customer information if it exists
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: invoice.customer as string }
  })

  if (stripeCustomer) {
    await prisma.stripeCustomer.update({
      where: { id: stripeCustomer.id },
      data: {
        balance: stripeCustomer.balance + paidAmount
      }
    })
  }

  // Check if this payment completion should stop any recurring messages
  if (parent.payments.length === 0 || parent.payments.every(p => p.status === 'paid')) {
    await prisma.recurringRecipient.updateMany({
      where: {
        parentId: parent.id,
        isActive: true,
        stopReason: null
      },
      data: {
        isActive: false,
        stopReason: 'all_payments_completed',
        stoppedAt: new Date()
      }
    })
    console.log(`Stopped recurring messages for parent ${parent.name} - all payments completed`)
  }

  console.log(`Successfully processed payment for parent ${parent.name}: $${paidAmount}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await prisma.stripeInvoice.updateMany({
    where: { stripeInvoiceId: invoice.id },
    data: {
      status: 'payment_failed',
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null
    }
  })

  // Update related payment if exists
  const payment = await prisma.payment.findUnique({
    where: { stripeInvoiceId: invoice.id }
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        failureReason: 'Payment failed in Stripe'
      }
    })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: subscription.customer as string }
  })

  if (stripeCustomer) {
    await prisma.stripeSubscription.create({
      data: {
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAt: (subscription as any).cancel_at ? new Date((subscription as any).cancel_at * 1000) : null,
        canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
        trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
        trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
        priceId: subscription.items.data[0]?.price.id || null,
        quantity: subscription.items.data[0]?.quantity || 1,
        metadata: subscription.metadata ? JSON.parse(JSON.stringify(subscription.metadata)) : null
      }
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.stripeSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAt: (subscription as any).cancel_at ? new Date((subscription as any).cancel_at * 1000) : null,
      canceledAt: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
      trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      priceId: subscription.items.data[0]?.price.id || null,
      quantity: subscription.items.data[0]?.quantity || 1,
      metadata: subscription.metadata ? JSON.parse(JSON.stringify(subscription.metadata)) : null
    }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.stripeSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date()
    }
  })
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId: paymentMethod.customer as string }
  })

  if (stripeCustomer) {
    await prisma.stripePaymentMethod.create({
      data: {
        stripeCustomerId: stripeCustomer.id,
        stripePaymentMethodId: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? JSON.parse(JSON.stringify(paymentMethod.card)) : null,
        bankAccount: paymentMethod.us_bank_account ? JSON.parse(JSON.stringify(paymentMethod.us_bank_account)) : null,
        metadata: paymentMethod.metadata ? JSON.parse(JSON.stringify(paymentMethod.metadata)) : null
      }
    })
  }
}
