
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'

export async function POST(request: Request) {
  try {
    await requireAuth()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const parentId = formData.get('parentId') as string
    const templateType = formData.get('templateType') as string
    const notes = formData.get('notes') as string
    const expiresAt = formData.get('expiresAt') as string

    if (!file || !parentId) {
      return NextResponse.json({ error: 'Missing file or parent ID' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // For now, just return success since contracts functionality isn't implemented
    // TODO: Implement contracts table in Convex schema and file upload handling
    console.log('Contract upload requested:', {
      fileName: file.name,
      fileSize: file.size,
      parentId,
      templateType,
      notes,
      expiresAt
    });

    const mockContract = {
      id: `contract_${Date.now()}`,
      parentId,
      fileName: `uploaded_${file.name}`,
      originalName: file.name,
      fileUrl: `/uploads/contracts/mock_${file.name}`,
      fileSize: file.size,
      mimeType: file.type,
      status: 'pending',
      templateType: templateType || null,
      notes: notes || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      uploadedAt: new Date(),
      parent: {
        name: 'Sample Parent',
        email: 'parent@example.com'
      }
    };

    return NextResponse.json({
      success: true,
      contract: mockContract,
      message: 'Contract uploaded successfully (mock)'
    })
  } catch (error) {
    console.error('Contract upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload contract' },
      { status: 500 }
    )
  }
}
