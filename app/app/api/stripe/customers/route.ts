
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/db';
import Stripe from 'stripe';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const linkCustomerSchema = z.object({
  parentId: z.string(),
  stripeCustomerId: z.string().optional(),
  createNew: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, stripeCustomerId, createNew } = linkCustomerSchema.parse(body);

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
    let customerId = stripeCustomerId;

    // Create new Stripe customer if requested
    if (createNew || !customerId) {
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
    }

    // Update parent with Stripe customer ID
    await prisma.parent.update({
      where: { id: parentId },
      data: {
        stripeCustomerId: customerId
      }
    });

    // Create or update StripeCustomer record
    const existingStripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { stripeCustomerId: customerId! }
    });

    if (existingStripeCustomer) {
      await prisma.stripeCustomer.update({
        where: { id: existingStripeCustomer.id },
        data: {
          parentId: parent.id,
          email: parent.email,
          name: parent.name,
          phone: parent.phone
        }
      });
    } else {
      // Fetch customer details from Stripe
      const stripeCustomer = await stripe.customers.retrieve(customerId!);
      
      await prisma.stripeCustomer.create({
        data: {
          parentId: parent.id,
          stripeCustomerId: customerId!,
          email: parent.email,
          name: parent.name,
          phone: parent.phone,
          delinquent: (stripeCustomer as Stripe.Customer).delinquent || false,
          balance: (stripeCustomer as Stripe.Customer).balance || 0,
          currency: (stripeCustomer as Stripe.Customer).currency || 'usd'
        }
      });
    }

    return NextResponse.json({
      success: true,
      parentId: parent.id,
      stripeCustomerId: customerId,
      message: `Successfully linked Stripe customer ${customerId} to parent ${parent.name}`
    });

  } catch (error) {
    console.error('Error linking Stripe customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to link Stripe customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        stripeCustomer: true,
        payments: {
          where: {
            status: {
              in: ['pending', 'overdue']
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    let stripeCustomerDetails = null;
    if (parent.stripeCustomerId) {
      try {
        const stripe = getStripe();
        stripeCustomerDetails = await stripe.customers.retrieve(parent.stripeCustomerId);
      } catch (error) {
        console.error('Error fetching Stripe customer:', error);
      }
    }

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        stripeCustomerId: parent.stripeCustomerId,
        pendingPayments: parent.payments.length,
        totalPendingAmount: parent.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      },
      stripeCustomer: parent.stripeCustomer,
      stripeCustomerDetails,
      isLinked: !!parent.stripeCustomerId
    });

  } catch (error) {
    console.error('Error fetching parent Stripe info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parent Stripe information' },
      { status: 500 }
    );
  }
}
