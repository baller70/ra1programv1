const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://blessed-scorpion-846.convex.cloud");

async function testQueries() {
  try {
    console.log("🔍 Testing Convex queries...");
    
    const paymentsResult = await client.query("payments:getPayments", { 
      limit: 50, 
      program: "yearly-program" 
    });
    console.log(`📊 Payments query result:`, paymentsResult);
    
    const parentsResult = await client.query("parents:getParents", { 
      limit: 100 
    });
    console.log(`👨‍👩‍👧‍👦 Parents query result:`, parentsResult);
    
  } catch (error) {
    console.error("❌ Query failed:", error);
  }
}

testQueries();
