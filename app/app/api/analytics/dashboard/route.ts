
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { convexHttp } from '../../../../lib/db'
import { api } from '../../../../convex/_generated/api'

export async function GET() {
  try {
    await requireAuth()
    
    // Get analytics dashboard data from Convex
    const dashboardData = await convexHttp.query(api.dashboard.getAnalyticsDashboard, {});

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
}
