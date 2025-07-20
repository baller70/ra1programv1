import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateTeams() {
  console.log('🔄 Starting team migration...')
  
  try {
    // Create some sample teams
    const sampleTeams = [
      {
        name: 'Rises as One Red',
        description: 'Red team for competitive basketball',
        color: '#ef4444'
      },
      {
        name: 'Rises as One Blue',
        description: 'Blue team for competitive basketball',
        color: '#3b82f6'
      },
      {
        name: 'Thunder Bolts',
        description: 'Advanced training group',
        color: '#8b5cf6'
      },
      {
        name: 'Lightning Strikes',
        description: 'Intermediate skill level team',
        color: '#f59e0b'
      },
      {
        name: 'Storm Chasers',
        description: 'Beginner friendly team',
        color: '#10b981'
      }
    ]

    // Create teams
    for (const teamData of sampleTeams) {
      const existingTeam = await prisma.team.findUnique({
        where: { name: teamData.name }
      })

      if (!existingTeam) {
        const team = await prisma.team.create({
          data: teamData
        })
        console.log(`✅ Created team: ${team.name}`)
      } else {
        console.log(`⏭️  Team already exists: ${teamData.name}`)
      }
    }

    // Get all parents and randomly assign them to teams (for demo purposes)
    const parents = await prisma.parent.findMany({
      where: { teamId: null }
    })

    const teams = await prisma.team.findMany()

    if (parents.length > 0 && teams.length > 0) {
      console.log(`🔄 Assigning ${parents.length} parents to teams...`)
      
      for (const parent of parents) {
        // Randomly assign to a team or leave unassigned (20% chance)
        const shouldAssign = Math.random() > 0.2
        
        if (shouldAssign) {
          const randomTeam = teams[Math.floor(Math.random() * teams.length)]
          
          await prisma.parent.update({
            where: { id: parent.id },
            data: { teamId: randomTeam.id }
          })
          
          console.log(`👥 Assigned ${parent.name} to ${randomTeam.name}`)
        } else {
          console.log(`👤 Left ${parent.name} unassigned`)
        }
      }
    }

    console.log('✅ Team migration completed successfully!')

    // Print summary
    const teamSummary = await prisma.team.findMany({
      include: {
        _count: {
          select: {
            parents: true
          }
        }
      }
    })

    console.log('\n📊 Team Summary:')
    teamSummary.forEach(team => {
      console.log(`  ${team.name}: ${team._count.parents} parents`)
    })

    const unassignedCount = await prisma.parent.count({
      where: { teamId: null }
    })
    console.log(`  Unassigned: ${unassignedCount} parents`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTeams().catch(console.error)
}

export { migrateTeams } 