import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    role: v.string(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
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
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_team", ["teamId"]),

  paymentPlans: defineTable({
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    parentId: v.optional(v.any()),
    totalAmount: v.optional(v.number()),
    installmentAmount: v.optional(v.number()),
    installments: v.optional(v.number()),
    startDate: v.optional(v.any()),
    endDate: v.optional(v.any()),
    description: v.optional(v.string()),
    name: v.optional(v.string()),
    frequency: v.optional(v.string()),
    nextDueDate: v.optional(v.any()),
    stripePriceId: v.optional(v.any()),
    stripeSubscriptionId: v.optional(v.any()),
  })
    .index("by_parent", ["parentId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  payments: defineTable({
    parentId: v.optional(v.any()),
    paymentPlanId: v.optional(v.any()),
    dueDate: v.optional(v.number()),
    amount: v.optional(v.number()),
    status: v.optional(v.string()),
    stripeInvoiceId: v.optional(v.any()),
    stripePaymentId: v.optional(v.any()),
    paidAt: v.optional(v.any()),
    failureReason: v.optional(v.any()),
    remindersSent: v.optional(v.number()),
    lastReminderSent: v.optional(v.any()),
    notes: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
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
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"]),

  templates: defineTable({
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    body: v.optional(v.string()),
    channel: v.optional(v.string()),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    isAiGenerated: v.optional(v.boolean()),
    usageCount: v.optional(v.number()),
    variables: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  messageLogs: defineTable({
    content: v.optional(v.string()), // Field exists as 'body' in data
    createdAt: v.optional(v.number()), // Missing in some records
    failureReason: v.optional(v.string()),
    parentId: v.string(),
    sentAt: v.optional(v.float64()),
    status: v.string(),
    subject: v.string(),
    templateId: v.optional(v.string()),
    type: v.optional(v.string()),
    body: v.optional(v.string()),
    channel: v.optional(v.string()),
    deliveredAt: v.optional(v.number()),
    errorMessage: v.optional(v.any()),
    metadata: v.optional(v.any()),
    readAt: v.optional(v.any()),
  })
    .index("by_parent", ["parentId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_sent_date", ["sentAt"]),

  auditLogs: defineTable({
    userId: v.optional(v.any()),
    action: v.optional(v.string()),
    resource: v.optional(v.string()),
    resourceId: v.optional(v.any()),
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource"])
    .index("by_created_at", ["createdAt"]),

  systemSettings: defineTable({
    key: v.string(),
    value: v.optional(v.any()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.any()),
    updatedAt: v.optional(v.any()),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),
});      