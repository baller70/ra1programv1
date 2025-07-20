
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import { 
  requireAuth, 
  createErrorResponse, 
  createSuccessResponse, 
  isDatabaseError,
  ApiErrors 
} from '../../../lib/api-utils'
import { 
  CreateParentSchema, 
  validateData, 
  sanitizeParentData 
} from '../../../lib/validation'

export async function GET(request: Request) {
  // Define variables outside try block for error handling
  let limit = 50
  let offset = 0
  
  try {
    // Temporarily disabled for testing: await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    limit = parseInt(searchParams.get('limit') || '50')
    offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const parents = await prisma.parent.findMany({
      where,
      include: {
        payments: {
          where: { status: 'overdue' },
          select: { id: true, amount: true, dueDate: true }
        },
        contracts: {
          where: { status: 'pending' },
          select: { id: true, originalName: true }
        },
        _count: {
          select: {
            payments: true,
            contracts: true,
            messageLogs: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await prisma.parent.count({ where })

    return NextResponse.json({
      parents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Parents fetch error:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: 'Unable to connect to the database. Please try again later.' 
        },
        { status: 503 }
      )
    }

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createErrorResponse(ApiErrors.UNAUTHORIZED)
    }

    if (isDatabaseError(error)) {
      return createErrorResponse(ApiErrors.DATABASE_ERROR)
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth()

    const body = await request.json()
    
    // Validate and sanitize input data
    const validatedData = validateData(CreateParentSchema, body)
    const sanitizedData = sanitizeParentData(validatedData)

    // Check if email already exists
    const existingParent = await prisma.parent.findUnique({
      where: { email: sanitizedData.email }
    })

    if (existingParent) {
      return NextResponse.json(
        { error: 'A parent with this email already exists' },
        { status: 409 }
      )
    }

    const parent = await prisma.parent.create({
      data: {
        ...sanitizedData,
        status: 'active'
      }
    });

    return createSuccessResponse(parent, 201);
  } catch (error) {
    console.error('Parent creation error:', error)
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createErrorResponse(ApiErrors.UNAUTHORIZED)
    }
    
    if (isDatabaseError(error)) {
      return createErrorResponse(ApiErrors.DATABASE_ERROR)
    }

    return NextResponse.json(
      { error: 'Failed to create parent' },
      { status: 500 }
    )
  }
}
