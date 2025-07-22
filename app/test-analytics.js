const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");

async function testAnalytics() {
  try {
    console.log("🔍 Testing analytics query...");
    
    const analyticsResult = await client.query("payments:getPaymentAnalytics", { 
      program: "yearly-program", 
      latestOnly: true 
    });
    console.log(`📊 Analytics result:`, analyticsResult);
    
  } catch (error) {
    console.error("❌ Analytics query failed:", error);
  }
}

testAnalytics();
