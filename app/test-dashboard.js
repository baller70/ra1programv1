const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");

async function testDashboard() {
  try {
    console.log("🔍 Testing dashboard queries...");
    
    const statsResult = await client.query("dashboard:getDashboardStats", {});
    console.log(`📊 Dashboard stats:`, statsResult);
    
    const trendsResult = await client.query("dashboard:getRevenueTrends", {});
    console.log(`📈 Revenue trends:`, trendsResult);
    
  } catch (error) {
    console.error("❌ Dashboard queries failed:", error);
  }
}

testDashboard();
