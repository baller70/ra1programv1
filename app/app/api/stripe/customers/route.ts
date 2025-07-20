
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
    const action = searchParams.get('action');

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        stripeCustomer: true,
        payments: {
          where: {
            status: { in: ['pending', 'overdue'] }
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

    // Handle portal action
    if (action === 'portal') {
      if (!parent.stripeCustomer?.stripeCustomerId) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
      }

      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: parent.stripeCustomer.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/${parent.id}`,
      });

      return NextResponse.json({
        success: true,
        url: session.url,
        message: 'Customer portal session created'
      });
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
        phone: parent.phone,
        stripeCustomerId: parent.stripeCustomerId
      },
      stripeCustomer: parent.stripeCustomer,
      stripeCustomerDetails,
      pendingPayments: parent.payments
    });

  } catch (error) {
    console.error('Error fetching Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentId, action } = body;

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

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

    if (action === 'portal') {
      // Create Stripe Customer Portal session
      if (!parent.stripeCustomer?.stripeCustomerId) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: parent.stripeCustomer.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payments/${parentId}`,
      });

      return NextResponse.json({
        success: true,
        portalUrl: session.url,
        message: 'Customer portal session created'
      });
    }

    if (action === 'sync') {
      // Sync customer data from Stripe
      if (!parent.stripeCustomer?.stripeCustomerId) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
      }

      const stripeCustomer = await stripe.customers.retrieve(parent.stripeCustomer.stripeCustomerId);
      
      if ('deleted' in stripeCustomer && stripeCustomer.deleted) {
        return NextResponse.json({ error: 'Stripe customer has been deleted' }, { status: 404 });
      }

      // Update local customer data
      await prisma.stripeCustomer.update({
        where: { id: parent.stripeCustomer.id },
        data: {
          email: stripeCustomer.email!,
          name: stripeCustomer.name || null,
          phone: stripeCustomer.phone || null,
          balance: stripeCustomer.balance || 0,
          delinquent: stripeCustomer.delinquent || false,
          currency: stripeCustomer.currency || 'usd',
          defaultPaymentMethod: (stripeCustomer as any).default_source as string || null,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Customer data synced successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to update Stripe customer' },
      { status: 500 }
    );
  }
}
