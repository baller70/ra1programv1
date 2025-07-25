

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { convexHttp } from '../../../../lib/db'
import { api } from '../../../../convex/_generated/api'

// Define types inline since they don't exist in lib/types
interface BulkUploadParent {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}

interface BulkImportResult {
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    message: string;
  }>;
  successfulParents: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    
    const { parents }: { parents: BulkUploadParent[] } = await request.json()
    
    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return NextResponse.json({ error: 'No valid parent data provided' }, { status: 400 })
    }

    const result: BulkImportResult = {
      success: false,
      created: 0,
      failed: 0,
      errors: [],
      successfulParents: []
    }

    // Get all existing parents to check for duplicates
    const existingParentsResponse = await convexHttp.query(api.parents.getParents, {});
    const existingEmails = new Set(existingParentsResponse.parents.map((p: any) => p.email.toLowerCase()));

    // Process each parent individually since Convex doesn't have transactions
    for (let i = 0; i < parents.length; i++) {
      const parentData = parents[i]
      const rowNum = i + 1

      try {
        // Check for existing email
        if (existingEmails.has(parentData.email.toLowerCase())) {
          result.failed++
          result.errors.push({
            row: rowNum,
            email: parentData.email,
            message: 'Email already exists in database'
          })
          continue
        }

        // Create parent record in Convex
        const createdParentId = await convexHttp.mutation(api.parents.createParent, {
          name: parentData.name.trim(),
          email: parentData.email.toLowerCase().trim(),
          phone: parentData.phone?.trim() || undefined,
          address: parentData.address?.trim() || undefined,
          emergencyContact: parentData.emergencyContact?.trim() || undefined,
          emergencyPhone: parentData.emergencyPhone?.trim() || undefined,
          notes: parentData.notes?.trim() || undefined,
          status: 'active'
        });

        // Add to existing emails set to prevent duplicates in the same batch
        existingEmails.add(parentData.email.toLowerCase());

        result.created++
        result.successfulParents.push({
          id: createdParentId,
          name: parentData.name,
          email: parentData.email
        })

      } catch (error) {
        console.error(`Error creating parent ${parentData.email}:`, error)
        result.failed++
        result.errors.push({
          row: rowNum,
          email: parentData.email,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }

    result.success = result.created > 0

    return NextResponse.json(result)
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to import parents. Please try again.' },
      { status: 500 }
    )
  }
}
