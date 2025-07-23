import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPaymentPlans = query({
  args: {
    search: v.optional(v.string()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const paymentPlans = await ctx.db.query("paymentPlans").collect();

    // Filter by search term if provided
    let filteredPlans = paymentPlans;
    if (args.search) {
      filteredPlans = paymentPlans.filter(plan => 
        (plan.name && plan.name.toLowerCase().includes(args.search!.toLowerCase())) ||
        (plan.description && plan.description.toLowerCase().includes(args.search!.toLowerCase())) ||
        (plan.type && plan.type.toLowerCase().includes(args.search!.toLowerCase()))
      );
    }

    // Filter by type if provided
    if (args.type) {
      filteredPlans = filteredPlans.filter(plan => plan.type === args.type);
    }

    // Filter by status if provided
    if (args.status) {
      filteredPlans = filteredPlans.filter(plan => plan.status === args.status);
    }

    return {
      paymentPlans: filteredPlans.map(plan => ({
        id: plan._id,
        name: plan.name || 'Unnamed Plan',
        description: plan.description || '',
        type: plan.type || 'standard',
        totalAmount: plan.totalAmount || 0,
        installmentAmount: plan.installmentAmount || 0,
        installments: plan.installments || 1,
        frequency: plan.frequency || 'monthly',
        status: plan.status || 'active',
        createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : new Date().toISOString(),
        activeSubscriptions: 0, // Mock data - would need to calculate from related data
        totalRevenue: plan.totalAmount || 0
      }))
    };
  },
});

export const getPaymentPlan = query({
  args: { id: v.id("paymentPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.id);
    if (!plan) return null;

    return {
      id: plan._id,
      name: plan.name || 'Unnamed Plan',
      description: plan.description || '',
      type: plan.type || 'standard',
      totalAmount: plan.totalAmount || 0,
      installmentAmount: plan.installmentAmount || 0,
      installments: plan.installments || 1,
      frequency: plan.frequency || 'monthly',
      status: plan.status || 'active',
      createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : new Date().toISOString(),
    };
  },
});

export const createPaymentPlan = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
    installments: v.number(),
    frequency: v.string(),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.db.insert("paymentPlans", {
      name: args.name,
      description: args.description,
      type: args.type,
      totalAmount: args.totalAmount,
      installmentAmount: args.installmentAmount,
      installments: args.installments,
      frequency: args.frequency,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return { success: true, id: planId };
  },
});

export const updatePaymentPlan = mutation({
  args: {
    id: v.id("paymentPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    installmentAmount: v.optional(v.number()),
    installments: v.optional(v.number()),
    frequency: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });

    return { success: true };
  },
});

export const deletePaymentPlan = mutation({
  args: { id: v.id("paymentPlans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
}); 