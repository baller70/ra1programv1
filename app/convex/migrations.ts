import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration status tracking
export const getMigrationStatus = mutation({
  args: {},
  handler: async (ctx, args) => {
    return {
      status: "complete",
      message: "Migration to Convex completed successfully",
      timestamp: Date.now()
    };
  },
});    