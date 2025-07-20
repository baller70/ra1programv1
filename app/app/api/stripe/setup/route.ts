import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Get parent information
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        stripeCustomer: true
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    const stripe = getStripe();
    let customerId = parent.stripeCustomer?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: parent.name,
        email: parent.email,
        phone: parent.phone || undefined,
        metadata: {
          parentId: parent.id,
          source: 'ra1-app'
        }
      });
      customerId = customer.id;

      // Update parent with Stripe customer ID
      await prisma.parent.update({
        where: { id: parentId },
        data: {
          stripeCustomerId: customerId
        }
      });

      // Create StripeCustomer record
      await prisma.stripeCustomer.create({
        data: {
          parentId: parent.id,
          stripeCustomerId: customerId,
          email: parent.email,
          name: parent.name,
          phone: parent.phone,
          delinquent: false,
          balance: 0,
          currency: 'usd'
        }
      });
    }

    // Create a setup session for adding payment methods
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'setup',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/${parentId}?setup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/${parentId}?setup=cancelled`,
      payment_method_types: ['card'],
      metadata: {
        parentId: parent.id,
        action: 'payment_setup'
      }
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      customerId: customerId,
      message: 'Setup session created successfully'
    });

  } catch (error) {
    console.error('Error creating Stripe setup session:', error);
    return NextResponse.json(
      { error: 'Failed to create setup session' },
      { status: 500 }
    );
  }
} 