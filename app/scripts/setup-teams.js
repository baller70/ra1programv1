const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupTeams() {
  console.log('🔄 Setting up teams...')
  
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

    console.log('✅ Sample teams ready for creation')
    console.log('Run this script after updating your Prisma schema and running migrations')
    
    // Log the teams that will be created
    sampleTeams.forEach(team => {
      console.log(`📋 ${team.name} - ${team.description}`)
    })

  } catch (error) {
    console.error('❌ Setup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupTeams().catch(console.error) 