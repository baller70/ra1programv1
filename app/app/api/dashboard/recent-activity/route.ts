
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { convexHttp } from '../../../../lib/db'
import { api } from '../../../../convex/_generated/api'

export async function GET() {
  try {
    await requireAuth()
    
    // Get recent activity from Convex
    const activities = await convexHttp.query(api.dashboard.getRecentActivity, {});

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Recent activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
