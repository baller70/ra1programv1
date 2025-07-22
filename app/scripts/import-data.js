require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs');
const path = require('path');

console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function importData() {
  try {
    console.log('Starting data import...');
    
    const parentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../convex-data-parents.json'), 'utf8'));
    console.log(`Importing ${parentsData.length} parents...`);
    
    const parentsResult = await client.mutation("migrations:importPrismaData", {
      tableName: "parents",
      data: parentsData
    });
    console.log('Parents import result:', parentsResult);
    
    const paymentPlansData = JSON.parse(fs.readFileSync(path.join(__dirname, '../convex-data-paymentPlans.json'), 'utf8'));
    console.log(`Importing ${paymentPlansData.length} payment plans...`);
    
    const plansResult = await client.mutation("migrations:importPrismaData", {
      tableName: "paymentPlans", 
      data: paymentPlansData
    });
    console.log('Payment plans import result:', plansResult);
    
    const paymentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../convex-data-payments.json'), 'utf8'));
    console.log(`Importing ${paymentsData.length} payments...`);
    
    const paymentsResult = await client.mutation("migrations:importPrismaData", {
      tableName: "payments",
      data: paymentsData
    });
    console.log('Payments import result:', paymentsResult);
    
    console.log('Data import completed successfully!');
    
    const status = await client.mutation("migrations:getMigrationStatus", {});
    console.log('Migration status:', status);
    
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();
