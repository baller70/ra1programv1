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
    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Get upcoming dues (next 30 days)
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const upcomingDues = pendingPayments.filter(p => 
      p.dueDate && p.dueDate >= now && p.dueDate <= thirtyDaysFromNow
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
      
      const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
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
        let parent = null;
        try {
          if (payment.parentId && typeof payment.parentId === 'string' && payment.parentId.length >= 25) {
            parent = await ctx.db.get(payment.parentId as any);
          }
        } catch (error) {
          console.log('Could not fetch parent for recent activity:', payment._id);
        }
        
        activities.push({
          id: `payment-${payment._id}`,
          type: 'payment',
          description: `Payment of $${payment.amount || 0} received`,
          parentName: (parent as any)?.name || 'Unknown Parent',
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
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    // Generate revenue by month data for the last 6 months
    const revenueByMonth = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthPayments = payments.filter(p => 
        p.paidAt && p.paidAt >= month.getTime() && p.paidAt < nextMonth.getTime()
      );
      
      const revenue = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      revenueByMonth.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        payments: monthPayments.length
      });
    }

    // Mock recent activity (would be replaced with actual activity tracking)
    const recentActivity = payments
      .filter(p => p.paidAt)
      .slice(0, 10)
      .map(p => ({
        id: p._id,
        type: 'payment',
        description: `Payment of $${p.amount || 0} received`,
        timestamp: new Date(p.paidAt!),
        parentName: 'Unknown Parent' // Would need to join with parent data
      }));

    return {
      overview: {
        totalParents,
        totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        overduePayments: overduePayments.length,
        upcomingDues: pendingPayments.length,
        activePaymentPlans: paymentPlans.length,
        messagesSentThisMonth: 0, // Mock data
        activeRecurringMessages: 0, // Mock data
        pendingRecommendations: 0, // Mock data
        backgroundJobsRunning: 0, // Mock data
      },
      revenueByMonth,
      recentActivity,
      paymentMethodStats: {
        card: Math.floor(payments.length * 0.7),
        bank_account: Math.floor(payments.length * 0.2),
        other: Math.floor(payments.length * 0.1)
      },
      communicationStats: {
        totalMessages: 0,
        deliveryRate: 95,
        channelBreakdown: {
          email: 80,
          sms: 20
        },
        deliveryStats: {
          delivered: 0,
          sent: 0,
          failed: 0
        }
      },
      recommendationsByPriority: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      recurringMessageStats: {
        totalRecurring: 0,
        activeRecurring: 0,
        messagesSentThisWeek: 0,
        averageSuccessRate: 0
      }
    };
  },
});

// AI Recommendations function (mock data for now)
export const getAIRecommendations = query({
  args: {},
  handler: async (ctx) => {
    // Mock AI recommendations data
    const mockRecommendations = [
      {
        id: "rec-1",
        title: "Optimize Payment Collection",
        description: "Several parents have overdue payments. Consider sending automated reminders.",
        priority: "high" as const,
        category: "payments",
        impact: "Could recover $2,500 in overdue payments",
        confidence: 85,
        createdAt: new Date().toISOString(),
        status: "pending" as const
      },
      {
        id: "rec-2", 
        title: "Improve Communication Engagement",
        description: "Email open rates are below average. Consider switching to SMS for better engagement.",
        priority: "medium" as const,
        category: "communication",
        impact: "Increase engagement by 30%",
        confidence: 72,
        createdAt: new Date().toISOString(),
        status: "pending" as const
      }
    ];

    return {
      recommendations: mockRecommendations
    };
  },
}); 