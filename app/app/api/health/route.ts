export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'disconnected',
    version: '1.0.0'
  }

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    health.database = 'connected'
  } catch (error) {
    console.error('Database health check failed:', error)
    health.status = 'unhealthy'
    health.database = 'error'
  }

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
} 