import { query } from "./_generated/server";
import { v } from "convex/values";

// Dashboard stats function (replaces /api/dashboard/stats)
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all parents
    const parents = await ctx.db.query("parents").collect();
    const activeParents = parents.filter(p => p.status === 'active');
    
    // Get all payments
    const payments = await ctx.db.query("payments").collect();
    const paidPayments = payments.filter(p => p.status === 'paid');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    
    // Calculate revenue
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Get upcoming dues (next 30 days)
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const upcomingDues = pendingPayments.filter(p => 
      p.dueDate >= now && p.dueDate <= thirtyDaysFromNow
    ).length;
    
    // Mock data for features not yet in Convex
    const activePaymentPlans = 0;
    const messagesSentThisMonth = 0;
    
    return {
      totalParents: activeParents.length,
      totalRevenue,
      overduePayments: overduePayments.length,
      upcomingDues,
      activePaymentPlans,
      messagesSentThisMonth
    };
  },
});

// Revenue trends function (replaces /api/dashboard/revenue-trends)
export const getRevenueTrends = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments")
      .filter(q => q.eq(q.field("status"), "paid"))
      .collect();
    
    // Group payments by month for the last 6 months
    const trends = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthPayments = payments.filter(p => 
        p.paidAt && p.paidAt >= month.getTime() && p.paidAt < nextMonth.getTime()
      );
      
      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      trends.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        payments: monthPayments.length
      });
    }
    
    return trends;
  },
});

// Recent activity function (replaces /api/dashboard/recent-activity)
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const activities: any[] = [];
    
    // Get recent payments
    const recentPayments = await ctx.db.query("payments")
      .filter(q => q.neq(q.field("paidAt"), undefined))
      .order("desc")
      .take(5);
    
    for (const payment of recentPayments) {
      if (payment.paidAt) {
        const parent = await ctx.db.get(payment.parentId);
        activities.push({
          id: `payment-${payment._id}`,
          type: 'payment',
          description: `Payment of $${payment.amount} received`,
          parentName: parent?.name || 'Unknown',
          timestamp: payment.paidAt
        });
      }
    }
    
    // Get recent parents
    const recentParents = await ctx.db.query("parents")
      .order("desc")
      .take(3);
    
    for (const parent of recentParents) {
      activities.push({
        id: `parent-${parent._id}`,
        type: 'parent_created',
        description: `New parent ${parent.name} added`,
        parentName: parent.name,
        timestamp: parent.createdAt
      });
    }
    
    // Sort by timestamp and return most recent
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  },
});

// Analytics dashboard function (replaces /api/analytics/dashboard)
export const getAnalyticsDashboard = query({
  args: {},
  handler: async (ctx) => {
    // Get all data
    const parents = await ctx.db.query("parents").collect();
    const payments = await ctx.db.query("payments").collect();
    const paymentPlans = await ctx.db.query("paymentPlans").collect();
    
    // Calculate stats
    const totalParents = parents.length;
    const activeParents = parents.filter(p => p.status === 'active').length;
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    // Payment stats
    const paymentStats = {
      totalPayments: payments.length,
      paidPayments: payments.filter(p => p.status === 'paid').length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      averagePaymentAmount: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
    };
    
    // Parent stats
    const parentStats = {
      totalParents,
      activeParents,
      inactiveParents: parents.filter(p => p.status === 'inactive').length,
      suspendedParents: parents.filter(p => p.status === 'suspended').length
    };
    
    // Contract stats (mock for now)
    const contractStats = {
      totalContracts: 0,
      signedContracts: 0,
      pendingContracts: 0,
      expiredContracts: 0
    };
    
    // Communication stats (mock for now)
    const communicationStats = {
      totalMessagesSent: 0,
      messagesThisMonth: 0,
      averageResponseRate: 0,
      lastMessageSent: null
    };
    
    // Risk assessment stats (mock for now)
    const riskAssessmentStats = {
      totalAssessments: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Recurring message stats (mock for now)
    const recurringMessageStats = {
      totalRecurring: 0,
      activeRecurring: 0,
      messagesSentThisWeek: 0,
      averageSuccessRate: 0
    };
    
    return {
      totalParents,
      activeParents,
      totalRevenue,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      paymentStats,
      parentStats,
      contractStats,
      communicationStats,
      riskAssessmentStats,
      recurringMessageStats
    };
  },
}); 