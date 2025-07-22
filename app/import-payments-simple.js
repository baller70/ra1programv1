const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");
const fs = require("fs");

async function importPayments() {
  try {
    console.log("🚀 Importing payment data...");
    const paymentsData = JSON.parse(fs.readFileSync("convex-data-payments.json", "utf8"));
    
    let imported = 0;
    for (const payment of paymentsData.slice(0, 10)) {
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
        console.log(`✅ Imported payment: $${payment.amount} - ${payment.status}`);
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
