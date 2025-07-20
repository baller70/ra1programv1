export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/db';

const assignParentsSchema = z.object({
  teamId: z.string().nullable(),
  parentIds: z.array(z.string()).min(1, 'At least one parent ID is required'),
});

const bulkAssignSchema = z.object({
  assignments: z.array(z.object({
    parentId: z.string(),
    teamId: z.string().nullable()
  })).min(1, 'At least one assignment is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, parentIds } = assignParentsSchema.parse(body);

    // Verify team exists if teamId is provided
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId }
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
    }

    // Verify all parent IDs exist
    const parents = await prisma.parent.findMany({
      where: {
        id: { in: parentIds }
      },
      select: { id: true, name: true }
    });

    if (parents.length !== parentIds.length) {
      const foundIds = parents.map(p => p.id);
      const missingIds = parentIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: 'Some parent IDs not found', missingIds },
        { status: 404 }
      );
    }

    // Update all parents with the new team assignment
    const updatedParents = await prisma.parent.updateMany({
      where: {
        id: { in: parentIds }
      },
      data: {
        teamId: teamId
      }
    });

    // Fetch updated parent information
    const result = await prisma.parent.findMany({
      where: {
        id: { in: parentIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        team: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${teamId ? 'assigned' : 'unassigned'} ${updatedParents.count} parent(s) ${teamId ? 'to team' : 'from teams'}`,
      updatedParents: result
    });

  } catch (error) {
    console.error('Error assigning parents to team:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to assign parents to team' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = bulkAssignSchema.parse(body);

    // Verify all team IDs exist
    const teamIds = [...new Set(assignments.map(a => a.teamId).filter(Boolean))];
    if (teamIds.length > 0) {
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true }
      });
      
      const foundTeamIds = teams.map(t => t.id);
      const missingTeamIds = teamIds.filter(id => !foundTeamIds.includes(id));
      
      if (missingTeamIds.length > 0) {
        return NextResponse.json(
          { error: 'Some team IDs not found', missingTeamIds },
          { status: 404 }
        );
      }
    }

    // Verify all parent IDs exist
    const parentIds = assignments.map(a => a.parentId);
    const parents = await prisma.parent.findMany({
      where: { id: { in: parentIds } },
      select: { id: true }
    });
    
    if (parents.length !== parentIds.length) {
      const foundParentIds = parents.map(p => p.id);
      const missingParentIds = parentIds.filter(id => !foundParentIds.includes(id));
      return NextResponse.json(
        { error: 'Some parent IDs not found', missingParentIds },
        { status: 404 }
      );
    }

    // Perform bulk assignments
    const results = [];
    for (const assignment of assignments) {
      const updatedParent = await prisma.parent.update({
        where: { id: assignment.parentId },
        data: { teamId: assignment.teamId },
        select: {
          id: true,
          name: true,
          email: true,
          team: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      });
      results.push(updatedParent);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated team assignments for ${results.length} parent(s)`,
      updatedParents: results
    });

  } catch (error) {
    console.error('Error bulk assigning parents to teams:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to bulk assign parents to teams' },
      { status: 500 }
    );
  }
} 