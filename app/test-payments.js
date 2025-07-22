const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");

async function testPayments() {
  try {
    console.log("🔍 Testing payments query...");
    
    const paymentsResult = await client.query("payments:getPayments", {
      program: "yearly-program",
      latestOnly: true
    });
    console.log(`📊 Payments result:`, paymentsResult);
    
    const parentsResult = await client.query("parents:getParents", {
      limit: 100
    });
    console.log(`👥 Parents result:`, parentsResult);
    
  } catch (error) {
    console.error("❌ Payments queries failed:", error);
  }
}

testPayments();
