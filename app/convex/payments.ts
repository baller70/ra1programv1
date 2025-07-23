import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getPayments = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    parentId: v.optional(v.id("parents")),
    teamId: v.optional(v.string()),
    search: v.optional(v.string()),
    latestOnly: v.optional(v.boolean()),
    program: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      page = 1,
      limit = 10,
      status,
      parentId,
      teamId,
      search,
      latestOnly = false,
    } = args;

    let paymentsQuery = ctx.db.query("payments");

    if (status) {
      paymentsQuery = paymentsQuery.filter((q) => q.eq(q.field("status"), status));
    }

    if (parentId) {
      paymentsQuery = paymentsQuery.filter((q) => q.eq(q.field("parentId"), parentId));
    }

    const payments = await paymentsQuery.collect();

    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        // Only try to get parent if parentId is a valid Convex ID
        let parent = null;
        try {
          if (payment.parentId && typeof payment.parentId === 'string' && payment.parentId.length >= 25) {
            parent = await ctx.db.get(payment.parentId as Id<"parents">);
          }
        } catch (error) {
          // Invalid ID, keep parent as null
          console.log('Could not fetch parent for payment:', payment._id, 'parentId:', payment.parentId);
        }

        // Only try to get payment plan if paymentPlanId is a valid Convex ID  
        let paymentPlan = null;
        try {
          if (payment.paymentPlanId && typeof payment.paymentPlanId === 'string' && payment.paymentPlanId.length >= 25) {
            paymentPlan = await ctx.db.get(payment.paymentPlanId as Id<"paymentPlans">);
          }
        } catch (error) {
          // Invalid ID, keep paymentPlan as null
          console.log('Could not fetch payment plan for payment:', payment._id);
        }

        return {
          ...payment,
          parent,
          paymentPlan,
          // Add fallback parent name if parent fetch failed
          parentName: parent?.name || 'Unknown Parent',
          parentEmail: parent?.email || 'No email'
        };
      })
    );

    let filteredPayments = enrichedPayments;
    if (search) {
      filteredPayments = enrichedPayments.filter((payment) =>
        (payment.parent?.name && payment.parent.name.toLowerCase().includes(search.toLowerCase())) ||
        (payment.parent?.email && payment.parent.email.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (latestOnly) {
      const latestPaymentsMap = new Map();
      filteredPayments.forEach((payment) => {
        const parentId = payment.parentId;
        if (!latestPaymentsMap.has(parentId) || 
            (payment.dueDate && latestPaymentsMap.get(parentId).dueDate && payment.dueDate > latestPaymentsMap.get(parentId).dueDate)) {
          latestPaymentsMap.set(parentId, payment);
        }
      });
      filteredPayments = Array.from(latestPaymentsMap.values());
    }

    filteredPayments.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    const offset = (page - 1) * limit;
    const paginatedPayments = filteredPayments.slice(offset, offset + limit);

    return {
      payments: paginatedPayments,
      pagination: {
        page,
        limit,
        total: filteredPayments.length,
        pages: Math.ceil(filteredPayments.length / limit),
      },
    };
  },
});

export const getPayment = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (!payment) return null;

    let parent = null;
    try {
      if (payment.parentId && typeof payment.parentId === 'string' && payment.parentId.length > 25) {
        parent = await ctx.db.get(payment.parentId as Id<"parents">);
      }
    } catch (error) {
      console.warn('Invalid parent ID:', payment.parentId);
    }

    let paymentPlan = null;
    try {
      if (payment.paymentPlanId && typeof payment.paymentPlanId === 'string' && payment.paymentPlanId.length > 25) {
        paymentPlan = await ctx.db.get(payment.paymentPlanId as Id<"paymentPlans">);
      }
    } catch (error) {
      console.warn('Invalid payment plan ID:', payment.paymentPlanId);
    }

    return {
      ...payment,
      parent,
      paymentPlan,
    };
  },
});

export const getPaymentAnalytics = query({
  args: {
    program: v.optional(v.string()),
    latestOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db.query("payments").collect();

    const totalRevenue = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const collectedPayments = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayments = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const overduePayments = payments
      .filter((p) => p.status === "overdue")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activePlans = await ctx.db
      .query("paymentPlans")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      totalRevenue,
      collectedPayments,
      pendingPayments,
      overduePayments,
      activePlans: activePlans.length,
      avgPaymentTime: 3,
    };
  },
});

export const createPayment = mutation({
  args: {
    parentId: v.id("parents"),
    paymentPlanId: v.optional(v.id("paymentPlans")),
    amount: v.number(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      parentId: args.parentId,
      paymentPlanId: args.paymentPlanId,
      dueDate: args.dueDate,
      amount: args.amount,
      status: "pending",
      stripeInvoiceId: undefined,
      stripePaymentId: undefined,
      paidAt: undefined,
      failureReason: undefined,
      remindersSent: 0,
      lastReminderSent: undefined,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

export const updatePayment = mutation({
  args: {
    id: v.id("payments"),
    status: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const deletePayment = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === "paid") {
      throw new Error("Cannot delete paid payment");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getPaymentHistory = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) return { history: [] };

    const history = [
      {
        id: "1",
        type: "created",
        description: "Payment created",
        timestamp: payment.createdAt,
        amount: payment.amount,
        status: "pending"
      }
    ];

    if (payment.paidAt) {
      history.push({
        id: "2",
        type: "paid",
        description: "Payment completed",
        timestamp: payment.paidAt,
        amount: payment.amount,
        status: "paid"
      });
    }

    return { history };
  },
});

export const createPaymentPlan = mutation({
  args: {
    parentId: v.id("parents"),
    type: v.string(),
    totalAmount: v.number(),
    installmentAmount: v.number(),
    installments: v.number(),
    startDate: v.number(),
    status: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const paymentPlanId = await ctx.db.insert("paymentPlans", {
      parentId: args.parentId,
      type: args.type,
      totalAmount: args.totalAmount,
      installmentAmount: args.installmentAmount,
      installments: args.installments,
      startDate: args.startDate,
      nextDueDate: args.startDate,
      status: args.status,
      stripeSubscriptionId: undefined,
      stripePriceId: undefined,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    return paymentPlanId;
  },
});

export const getPaymentPlans = query({
  args: {
    parentId: v.optional(v.id("parents")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let plansQuery = ctx.db.query("paymentPlans");

    if (args.parentId) {
      plansQuery = plansQuery.filter((q) => q.eq(q.field("parentId"), args.parentId));
    }

    if (args.status) {
      plansQuery = plansQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const plans = await plansQuery.collect();

    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const parent = await ctx.db.get(plan.parentId);
        return {
          ...plan,
          parent,
        };
      })
    );

    return enrichedPlans;
  },
});

// Debug function to check payment data structure
export const debugPaymentData = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").take(3);
    const parents = await ctx.db.query("parents").take(3);
    
    return {
      samplePayments: payments.map(p => ({
        id: p._id,
        parentId: p.parentId,
        parentIdType: typeof p.parentId,
        parentIdLength: p.parentId ? p.parentId.toString().length : 0,
        amount: p.amount,
        status: p.status
      })),
      sampleParents: parents.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email
      }))
    };
  },
});
