const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");

const fs = require('fs');

async function importData() {
  try {
    console.log("🚀 Starting data import...");
    
    // Import parents first
    console.log("📋 Importing parents...");
    const parentsData = JSON.parse(fs.readFileSync('convex-data-parents.json', 'utf8'));
    
    for (const parent of parentsData) {
      try {
        const result = await client.mutation("parents:createParent", {
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          address: parent.address,
          emergencyContact: parent.emergencyContact,
          emergencyPhone: parent.emergencyPhone,
          status: parent.status || 'active',
          teamId: parent.teamId,
          notes: parent.notes
        });
        console.log(`✅ Created parent: ${parent.name} (${result})`);
      } catch (err) {
        console.log(`⚠️  Skipping parent ${parent.name}: ${err.message}`);
      }
    }
    
    console.log("🎉 Data import completed!");
    
    // Test the data
    console.log("🔍 Testing data retrieval...");
    const parents = await client.query("parents:getParents", { limit: 5 });
    console.log(`📊 Found ${parents.parents.length} parents in database`);
    
    const payments = await client.query("payments:getPayments", { limit: 5 });
    console.log(`💰 Found ${payments.payments.length} payments in database`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

importData(); 