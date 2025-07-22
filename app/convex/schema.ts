import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    status: v.string(),
    contractStatus: v.optional(v.string()),
    contractUrl: v.optional(v.string()),
    contractUploadedAt: v.optional(v.number()),
    contractExpiresAt: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
    teamId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_team", ["teamId"]),

  paymentPlans: defineTable({
    parentId: v.id("parents"),
    type: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
    installments: v.number(),
    startDate: v.number(),
    nextDueDate: v.optional(v.number()),
    status: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  payments: defineTable({
    parentId: v.id("parents"),
    paymentPlanId: v.optional(v.id("paymentPlans")),
    dueDate: v.number(),
    amount: v.number(),
    status: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    stripePaymentId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    remindersSent: v.number(),
    lastReminderSent: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_payment_plan", ["paymentPlanId"])
    .index("by_parent_status", ["parentId", "status"]),

  teams: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"]),

  templates: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    type: v.string(),
    category: v.string(),
    isActive: v.boolean(),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  messageLogs: defineTable({
    parentId: v.string(),
    templateId: v.optional(v.string()),
    subject: v.string(),
    content: v.string(),
    type: v.string(),
    status: v.string(),
    sentAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_sent_date", ["sentAt"]),
});      