export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/db';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeParents = searchParams.get('includeParents') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

    const teams = await prisma.team.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        parents: includeParents ? {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          }
        } : false,
        _count: {
          select: {
            parents: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = createTeamSchema.parse(body);

    // Check if team name already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name }
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        color,
      },
      include: {
        _count: {
          select: {
            parents: true
          }
        }
      }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const validatedData = updateTeamSchema.parse(updateData);

    // If updating name, check for uniqueness
    if (validatedData.name) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id }
        }
      });

      if (existingTeam) {
        return NextResponse.json(
          { error: 'Team name already exists' },
          { status: 400 }
        );
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            parents: true
          }
        }
      }
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Check if team has parents
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            parents: true
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (team._count.parents > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team with assigned parents. Please reassign parents first.' },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 