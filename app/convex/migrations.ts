import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration script to import data from exported Prisma data
export const importPrismaData = mutation({
  args: {
    tableName: v.string(),
    data: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { tableName, data } = args;
    
    // Convert Prisma data format to Convex format
    const convertedData = data.map((record: any) => {
      const converted = { ...record };
      
      // Convert Date objects to timestamps
      Object.keys(converted).forEach(key => {
        if (converted[key] instanceof Date || 
            (typeof converted[key] === 'string' && 
             /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(converted[key]))) {
          converted[key] = new Date(converted[key]).getTime();
        }
      });
      
      // Remove Prisma-specific fields
      delete converted.id; // Convex generates its own IDs
      
      return converted;
    });
    
    // Insert data into the appropriate table
    const results = [];
    for (const record of convertedData) {
      try {
        const id = await ctx.db.insert(tableName as any, record);
        results.push({ success: true, id });
      } catch (error) {
        results.push({ success: false, error: String(error) });
      }
    }
    
    return {
      tableName,
      totalRecords: data.length,
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  },
});

// Helper to check migration status
export const getMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = ['users', 'parents', 'payments', 'paymentPlans', 'templates'];
    const status: Record<string, number | string> = {};
    
    for (const table of tables) {
      try {
        const count = await ctx.db
          .query(table as any)
          .collect()
          .then(results => results.length);
        status[table] = count;
      } catch (error) {
        status[table] = `Error: ${error}`;
      }
    }
    
    return status;
  },
}); 