const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");
const fs = require('fs');

async function importPayments() {
  try {
    console.log("🚀 Starting payment data import...");
    
    // Import payments
    console.log("💰 Importing payments...");
    const paymentsData = JSON.parse(fs.readFileSync('convex-data-payments.json', 'utf8'));
    
    let imported = 0;
    let skipped = 0;
    
    for (const payment of paymentsData) {
      try {
        const result = await client.mutation("payments:createPayment", {
          parentId: payment.parentId,
          amount: payment.amount,
          status: payment.status,
          dueDate: payment.dueDate,
          paidAt: payment.paidAt,
          program: payment.program,
          paymentPlanId: payment.paymentPlanId,
          description: payment.description,
          method: payment.method,
          transactionId: payment.transactionId,
          receiptUrl: payment.receiptUrl,
          notes: payment.notes
        });
        console.log(`✅ Imported payment: ${payment._id} - $${payment.amount}`);
        imported++;
      } catch (error) {
        console.log(`⚠️ Skipped payment ${payment._id}: ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Imported: ${imported} payments`);
    console.log(`⚠️ Skipped: ${skipped} payments`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

importPayments(); 