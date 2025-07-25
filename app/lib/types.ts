
import { Doc, Id } from "../convex/_generated/dataModel";

// Convex document types - only using tables that exist in schema
export type Parent = Doc<"parents">;
export type PaymentPlan = Doc<"paymentPlans">;
export type Payment = Doc<"payments">;
export type PaymentInstallment = Doc<"paymentInstallments">;
export type Template = Doc<"templates">;
export type MessageLog = Doc<"messageLogs">;
export type User = Doc<"users">;
export type Team = Doc<"teams">;
export type AuditLog = Doc<"auditLogs">;
export type SystemSettings = Doc<"systemSettings">;

// Extended types with relations
export type ParentWithRelations = Parent & {
  paymentPlans?: PaymentPlan[];
  payments?: Payment[];
  messageLogs?: MessageLog[];
  team?: Team;
};

export type PaymentWithRelations = Payment & {
  parent?: Parent;
  paymentPlan?: PaymentPlan;
  installments?: PaymentInstallment[];
};

export type PaymentPlanWithRelations = PaymentPlan & {
  parent?: Parent;
  payments?: Payment[];
};

export type TemplateWithRelations = Template & {
  messageLogs?: MessageLog[];
};

// Utility types
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type MessageChannel = 'email' | 'sms' | 'both';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'completed' | 'cancelled';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed' | 'implemented';

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T = any> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Dashboard types
export type DashboardStats = {
  totalParents: number;
  totalPayments: number;
  totalRevenue: number;
  overduePayments: number;
  recentActivity: any[];
};

// Communication types
export type BulkMessageRequest = {
  recipients: string[];
  template: string;
  variables?: Record<string, any>;
  channel: MessageChannel;
  scheduledFor?: number;
};

export type MessageTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  channel: MessageChannel;
};

// Analytics types
export type RevenueData = {
  month: string;
  revenue: number;
  payments: number;
};

export type PaymentAnalytics = {
  totalRevenue: number;
  totalPayments: number;
  averagePayment: number;
  overdueAmount: number;
  overdueCount: number;
  revenueByMonth: RevenueData[];
};

// Stripe types
export type StripePaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
};

// AI types
export type AIAnalysisResult = {
  insights: string[];
  recommendations: string[];
  score: number;
  confidence: number;
};

export type AIMessageGeneration = {
  subject: string;
  body: string;
  tone: 'formal' | 'friendly' | 'urgent';
  personalization: Record<string, any>;
};
// AI Recommendation type (for backwards compatibility)
export type AIRecommendation = {
  id: string;
  title: string;
  description: string;
  type: "payment" | "communication" | "template" | "workflow";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: RecommendationStatus;
  parentId?: string;
  paymentId?: string;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  autoExecutable?: boolean;
  isExecuted?: boolean;
  expectedImpact?: string;
  confidence?: number;
  context?: string;
  actions?: string[];
};

export type AIRecommendationWithRelations = AIRecommendation & {
  parent?: Parent;
  payment?: Payment;
  template?: Template;
};
