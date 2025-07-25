
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { convexHttp } from '../../../../lib/db'
import { api } from '../../../../convex/_generated/api'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Temporarily disabled for testing: await requireAuth()
    
    // Get parent from Convex
    const parent = await convexHttp.query(api.parents.getParent, {
      id: params.id as any
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    // Get related data
    const [paymentPlans, payments, messageLogs] = await Promise.all([
      // Get payment plans for this parent
      convexHttp.query(api.payments.getPayments, {
        parentId: params.id as any,
        page: 1,
        limit: 100
      }),
      // Get payments for this parent
      convexHttp.query(api.payments.getPayments, {
        parentId: params.id as any,
        page: 1,
        limit: 100
      }),
      // Get message logs - we'll need to create this query if it doesn't exist
      Promise.resolve([]) // Placeholder for now
    ]);

    // Combine the data
    const parentWithRelations = {
      ...parent,
      paymentPlans: [], // Will need to implement payment plans queries
      payments: payments.payments || [],
      messageLogs: messageLogs || []
    };

    return NextResponse.json(parentWithRelations)
  } catch (error) {
    console.error('Parent fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parent' },
      { status: 500 }
    )
  }
}
