import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Temporary simplified webhook for deployment
  console.log('Clerk webhook received')
  
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook received' 
  })
} 