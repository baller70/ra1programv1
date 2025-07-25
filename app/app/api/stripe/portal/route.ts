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
    const returnUrl = searchParams.get('returnUrl') || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments`;

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Get parent with Stripe customer information
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        stripeCustomer: true
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (!parent.stripeCustomer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    const stripe = getStripe();

    try {
      // Create Stripe Customer Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: parent.stripeCustomer.stripeCustomerId,
        return_url: returnUrl,
      });

      return NextResponse.json({
        url: session.url,
        success: true
      });
    } catch (stripeError) {
      console.error('Stripe error creating portal session:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create Stripe portal session' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
} 