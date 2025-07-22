const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");
const fs = require("fs");

async function importPayments() {
  try {
    console.log("🚀 Importing payment data...");
    
    // Get current parents to map parentIds
    const parentsResult = await client.query("parents:getParents", { limit: 100 });
    const parents = parentsResult.parents;
    console.log(`Found ${parents.length} parents to link payments to`);
    
    const paymentsData = JSON.parse(fs.readFileSync("convex-data-payments.json", "utf8"));
    
    let imported = 0;
    for (const payment of paymentsData.slice(0, 10)) {
      try {
        // Find a parent to link to (use first available parent for now)
        const parentId = parents[imported % parents.length]?._id;
        
        if (!parentId) {
          console.log("⚠️  No parent available to link payment to");
          continue;
        }
        
        const result = await client.mutation("payments:createPayment", {
          parentId: parentId,
          amount: payment.amount || 100,
          dueDate: payment.dueDate || Date.now() + 86400000,
          notes: payment.description || "Imported payment"
        });
        console.log(`✅ Imported payment: $${payment.amount || 100} for parent ${parentId}`);
        imported++;
      } catch (error) {
        console.log(`⚠️  Skipped payment: ${error.message}`);
      }
    }
    console.log(`🎉 Imported ${imported} payments!`);
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

importPayments();
