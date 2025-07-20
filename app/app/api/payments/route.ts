
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/db';
import { requireAuth } from '../../../lib/api-utils';

const createPaymentSchema = z.object({
  parentId: z.string(),
  paymentPlanId: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Helper function for error handling
function handleError(error: any, message: string) {
  console.error(message, error);
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid data', details: error.errors },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled: await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const program = searchParams.get('program') || 'yearly-program'
    const status = searchParams.get('status')
    const parentId = searchParams.get('parentId')
    const teamId = searchParams.get('teamId') // New team filter
    const search = searchParams.get('search')
    const latestOnly = searchParams.get('latestOnly') === 'true' // New parameter
    
    const offset = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (parentId) {
      where.parentId = parentId
    }

    // Add team filtering
    if (teamId) {
      where.parent = {
        teamId: teamId === 'unassigned' ? null : teamId
      }
    }

    if (search) {
      where.parent = {
        ...where.parent,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    let payments;
    
    if (latestOnly) {
      // Get all payments first, then filter to latest per parent in JavaScript
      const allPayments = await prisma.payment.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          },
          paymentPlan: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
              installmentAmount: true
            }
          }
        },
        orderBy: { dueDate: 'desc' }
      })

      // Group by parent and get the latest payment for each
      const latestPaymentsMap = new Map()
      allPayments.forEach(payment => {
        const parentId = payment.parentId
        if (!latestPaymentsMap.has(parentId)) {
          latestPaymentsMap.set(parentId, payment)
        }
      })
      
      payments = Array.from(latestPaymentsMap.values())
    } else {
      payments = await prisma.payment.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          },
          paymentPlan: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
              installmentAmount: true
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: limit,
        skip: offset
      })
    }

    const total = await prisma.payment.count({ where })

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth for development - remove this line in production
    // await requireAuth(request);
    
    const body = await request.json();
    
    // Basic validation
    const validatedData = createPaymentSchema.parse(body);

    // Get parent details
    const parent = await prisma.parent.findUnique({
      where: { id: validatedData.parentId },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get payment plan if provided
    let paymentPlan = null;
    if (validatedData.paymentPlanId) {
      paymentPlan = await prisma.paymentPlan.findUnique({
        where: { id: validatedData.paymentPlanId },
      });

      if (!paymentPlan) {
        return NextResponse.json(
          { error: 'Payment plan not found' },
          { status: 404 }
        );
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        parentId: validatedData.parentId,
        paymentPlanId: validatedData.paymentPlanId || null,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
        notes: validatedData.notes || null,
        status: 'pending',
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            stripeCustomerId: true,
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
            totalAmount: true,
            installmentAmount: true,
            stripePriceId: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      payment: {
        ...payment,
        formattedAmount: formatCurrency(Number(payment.amount)),
        isOverdue: false, // New payments are never overdue
        daysPastDue: 0,
      },
      message: 'Payment created successfully',
    }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Failed to create payment');
  }
}
