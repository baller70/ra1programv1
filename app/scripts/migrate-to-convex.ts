import { readFileSync } from 'fs';
import { join } from 'path';

interface MigrationData {
  [tableName: string]: any[];
}

async function migratePrismaToConvex() {
  console.log('🚀 Starting Prisma to Convex migration preparation...');
  
  try {
    // Read exported data
    const dataPath = join(process.cwd(), 'migration-data.json');
    const rawData = readFileSync(dataPath, 'utf8');
    const migrationData: MigrationData = JSON.parse(rawData);
    
    console.log(`📊 Found ${Object.keys(migrationData).length} tables to migrate`);
    
    // Tables to migrate in order (respecting relationships)
    const migrationOrder = [
      'users',
      'teams', 
      'parents',
      'paymentPlans',
      'payments',
      'templates',
      'messageLogs',
      'contracts',
      'systemSettings',
      'auditLogs',
      // Add more tables as needed
    ];
    
    let totalMigrated = 0;
    
    for (const tableName of migrationOrder) {
      const tableData = migrationData[tableName];
      
      if (!tableData || tableData.length === 0) {
        console.log(`⏭️  Skipping ${tableName} (no data)`);
        continue;
      }
      
      console.log(`\n📋 Migrating ${tableName}: ${tableData.length} records`);
      
      // Convert Prisma data to Convex format
      const convertedData = tableData.map(record => {
        const converted = { ...record };
        
        // Convert Date strings to timestamps
        Object.keys(converted).forEach(key => {
          const value = converted[key];
          if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            converted[key] = new Date(value).getTime();
          } else if (value instanceof Date) {
            converted[key] = value.getTime();
          }
        });
        
        // Remove Prisma ID (Convex generates its own)
        delete converted.id;
        
        return converted;
      });
      
      // Save to individual files that can be manually imported later
      console.log(`  📤 Converting ${convertedData.length} ${tableName} records...`);
      
      const outputPath = join(process.cwd(), `convex-data-${tableName}.json`);
      const fs = await import('fs');
      fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
      
      console.log(`  ✅ Prepared ${tableName} data for Convex import: ${outputPath}`);
      totalMigrated += convertedData.length;
    }
    
    console.log(`\n🎉 Migration preparation completed!`);
    console.log(`  📊 Total records prepared: ${totalMigrated}`);
    console.log(`  📁 Files created: convex-data-*.json`);
    console.log(`\n📋 Next steps:`);
    console.log(`  1. Fix Convex schema path issues or work around them`);
    console.log(`  2. Push schema to Convex deployment`);
    console.log(`  3. Import the prepared data files using Convex functions`);
    console.log(`  4. Update application code to use Convex`);
    console.log(`  5. Test and validate the migration`);
    
    return { success: true, recordsPrepared: totalMigrated };
    
  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    throw error;
  }
}

// Manual data import helper (use after schema is working)
export async function importTableData(tableName: string, data: any[]) {
  console.log(`Importing ${data.length} records to ${tableName}...`);
  
  // This would be used once we can call Convex mutations
  // For now, it's a placeholder for the actual import logic
  
  return { success: true, imported: data.length };
}

// Main execution
if (require.main === module) {
  migratePrismaToConvex()
    .then((result) => {
      console.log('\n✅ Migration preparation successful!', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration preparation failed:', error);
      process.exit(1);
    });
}

export { migratePrismaToConvex }; 