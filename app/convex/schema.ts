import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Test table to verify Convex is working
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  parents: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
}); 