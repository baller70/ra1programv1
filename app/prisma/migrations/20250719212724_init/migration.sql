-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "stripeCustomerId" TEXT,
    "contractUrl" TEXT,
    "contractStatus" TEXT NOT NULL DEFAULT 'pending',
    "contractUploadedAt" DATETIME,
    "contractExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "installmentAmount" REAL NOT NULL,
    "installments" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "nextDueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentPlan_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "paymentPlanId" TEXT,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeInvoiceId" TEXT,
    "stripePaymentId" TEXT,
    "paidAt" DATETIME,
    "failureReason" TEXT,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSent" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "channel" TEXT NOT NULL DEFAULT 'email',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "readAt" DATETIME,
    "errorMessage" TEXT,
    "metadata" JSONB,
    CONSTRAINT "MessageLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" DATETIME,
    "expiresAt" DATETIME,
    "templateType" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "sentAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "templateId" TEXT,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReminder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentReminder_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecurringMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "interval" TEXT NOT NULL,
    "intervalValue" INTEGER NOT NULL DEFAULT 1,
    "customSchedule" TEXT,
    "targetAudience" TEXT NOT NULL DEFAULT 'all',
    "audienceFilter" JSONB,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "stopConditions" TEXT NOT NULL DEFAULT '[]',
    "maxMessages" INTEGER,
    "escalationRules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pausedAt" DATETIME,
    "pausedReason" TEXT,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringMessageId" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "actualSentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "skipCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringInstance_recurringMessageId_fkey" FOREIGN KEY ("recurringMessageId") REFERENCES "RecurringMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringMessageId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stoppedAt" DATETIME,
    "stopReason" TEXT,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "lastMessageSent" DATETIME,
    "responseReceived" BOOLEAN NOT NULL DEFAULT false,
    "responseAt" DATETIME,
    "paymentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "paymentCompletedAt" DATETIME,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringRecipient_recurringMessageId_fkey" FOREIGN KEY ("recurringMessageId") REFERENCES "RecurringMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringRecipient_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringMessageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recurringInstanceId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "messageLogId" TEXT,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "sentAt" DATETIME,
    "metadata" JSONB,
    CONSTRAINT "RecurringMessageLog_recurringInstanceId_fkey" FOREIGN KEY ("recurringInstanceId") REFERENCES "RecurringInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringMessageLog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringMessageLog_messageLogId_fkey" FOREIGN KEY ("messageLogId") REFERENCES "MessageLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripeCustomer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "defaultPaymentMethod" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "delinquent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StripeCustomer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripePaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeCustomerId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "card" JSONB,
    "bankAccount" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StripePaymentMethod_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripeSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "paymentPlanId" TEXT,
    "status" TEXT NOT NULL,
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAt" DATETIME,
    "canceledAt" DATETIME,
    "trialStart" DATETIME,
    "trialEnd" DATETIME,
    "priceId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StripeSubscription_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StripeSubscription_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripeInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL,
    "amountDue" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "amountRemaining" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "paymentIntentId" TEXT,
    "hostedInvoiceUrl" TEXT,
    "invoicePdf" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextPaymentAttempt" DATETIME,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StripeInvoice_stripeCustomerId_fkey" FOREIGN KEY ("stripeCustomerId") REFERENCES "StripeCustomer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StripeInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "apiVersion" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" DATETIME,
    "errorMessage" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "changeDescription" TEXT,
    "performanceScore" REAL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateImprovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateVersionId" TEXT NOT NULL,
    "improvementType" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "improvedText" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" DATETIME,
    "acceptedBy" TEXT,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateImprovement_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT,
    "metricType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "TemplateAnalytics_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateAnalytics_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" REAL NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "targetEntityId" TEXT,
    "context" JSONB NOT NULL,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "autoExecutable" BOOLEAN NOT NULL DEFAULT false,
    "isExecuted" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" DATETIME,
    "executedBy" TEXT,
    "executionResult" JSONB,
    "dismissedAt" DATETIME,
    "dismissedBy" TEXT,
    "dismissReason" TEXT,
    "feedback" TEXT,
    "feedbackRating" INTEGER,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIRecommendationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recommendationId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isExecuted" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" DATETIME,
    "executionResult" JSONB,
    "errorMessage" TEXT,
    CONSTRAINT "AIRecommendationAction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "score" REAL,
    "confidence" REAL NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "factors" JSONB NOT NULL,
    "trends" JSONB,
    "predictions" JSONB,
    "recommendations" JSONB,
    "alertThreshold" REAL,
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduledFor" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "parameters" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" DATETIME,
    "parentJobId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BackgroundJob_parentJobId_fkey" FOREIGN KEY ("parentJobId") REFERENCES "BackgroundJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BackgroundJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_email_key" ON "Parent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_stripeCustomerId_key" ON "Parent"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Parent_email_idx" ON "Parent"("email");

-- CreateIndex
CREATE INDEX "Parent_status_idx" ON "Parent"("status");

-- CreateIndex
CREATE INDEX "Parent_stripeCustomerId_idx" ON "Parent"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_stripeSubscriptionId_key" ON "PaymentPlan"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "PaymentPlan_parentId_idx" ON "PaymentPlan"("parentId");

-- CreateIndex
CREATE INDEX "PaymentPlan_status_idx" ON "PaymentPlan"("status");

-- CreateIndex
CREATE INDEX "PaymentPlan_nextDueDate_idx" ON "PaymentPlan"("nextDueDate");

-- CreateIndex
CREATE INDEX "PaymentPlan_stripeSubscriptionId_idx" ON "PaymentPlan"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Payment_parentId_idx" ON "Payment"("parentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_stripeInvoiceId_idx" ON "Payment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Payment_stripePaymentId_idx" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Template_channel_idx" ON "Template"("channel");

-- CreateIndex
CREATE INDEX "Template_isActive_idx" ON "Template"("isActive");

-- CreateIndex
CREATE INDEX "MessageLog_parentId_idx" ON "MessageLog"("parentId");

-- CreateIndex
CREATE INDEX "MessageLog_channel_idx" ON "MessageLog"("channel");

-- CreateIndex
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");

-- CreateIndex
CREATE INDEX "MessageLog_sentAt_idx" ON "MessageLog"("sentAt");

-- CreateIndex
CREATE INDEX "Contract_parentId_idx" ON "Contract"("parentId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_expiresAt_idx" ON "Contract"("expiresAt");

-- CreateIndex
CREATE INDEX "Contract_uploadedAt_idx" ON "Contract"("uploadedAt");

-- CreateIndex
CREATE INDEX "ScheduledMessage_scheduledFor_idx" ON "ScheduledMessage"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledMessage_status_idx" ON "ScheduledMessage"("status");

-- CreateIndex
CREATE INDEX "ScheduledMessage_createdBy_idx" ON "ScheduledMessage"("createdBy");

-- CreateIndex
CREATE INDEX "PaymentReminder_paymentId_idx" ON "PaymentReminder"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentReminder_scheduledFor_idx" ON "PaymentReminder"("scheduledFor");

-- CreateIndex
CREATE INDEX "PaymentReminder_status_idx" ON "PaymentReminder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "RecurringMessage_isActive_idx" ON "RecurringMessage"("isActive");

-- CreateIndex
CREATE INDEX "RecurringMessage_interval_idx" ON "RecurringMessage"("interval");

-- CreateIndex
CREATE INDEX "RecurringMessage_targetAudience_idx" ON "RecurringMessage"("targetAudience");

-- CreateIndex
CREATE INDEX "RecurringMessage_createdBy_idx" ON "RecurringMessage"("createdBy");

-- CreateIndex
CREATE INDEX "RecurringInstance_scheduledFor_idx" ON "RecurringInstance"("scheduledFor");

-- CreateIndex
CREATE INDEX "RecurringInstance_status_idx" ON "RecurringInstance"("status");

-- CreateIndex
CREATE INDEX "RecurringInstance_recurringMessageId_idx" ON "RecurringInstance"("recurringMessageId");

-- CreateIndex
CREATE INDEX "RecurringRecipient_isActive_idx" ON "RecurringRecipient"("isActive");

-- CreateIndex
CREATE INDEX "RecurringRecipient_parentId_idx" ON "RecurringRecipient"("parentId");

-- CreateIndex
CREATE INDEX "RecurringRecipient_recurringMessageId_idx" ON "RecurringRecipient"("recurringMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringRecipient_recurringMessageId_parentId_key" ON "RecurringRecipient"("recurringMessageId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringMessageLog_messageLogId_key" ON "RecurringMessageLog"("messageLogId");

-- CreateIndex
CREATE INDEX "RecurringMessageLog_recurringInstanceId_idx" ON "RecurringMessageLog"("recurringInstanceId");

-- CreateIndex
CREATE INDEX "RecurringMessageLog_parentId_idx" ON "RecurringMessageLog"("parentId");

-- CreateIndex
CREATE INDEX "RecurringMessageLog_status_idx" ON "RecurringMessageLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_parentId_key" ON "StripeCustomer"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StripeCustomer_stripeCustomerId_idx" ON "StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StripeCustomer_parentId_idx" ON "StripeCustomer"("parentId");

-- CreateIndex
CREATE INDEX "StripeCustomer_email_idx" ON "StripeCustomer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StripePaymentMethod_stripePaymentMethodId_key" ON "StripePaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "StripePaymentMethod_stripeCustomerId_idx" ON "StripePaymentMethod"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StripePaymentMethod_stripePaymentMethodId_idx" ON "StripePaymentMethod"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "StripePaymentMethod_type_idx" ON "StripePaymentMethod"("type");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_stripeSubscriptionId_key" ON "StripeSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscription_paymentPlanId_key" ON "StripeSubscription"("paymentPlanId");

-- CreateIndex
CREATE INDEX "StripeSubscription_stripeCustomerId_idx" ON "StripeSubscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StripeSubscription_stripeSubscriptionId_idx" ON "StripeSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "StripeSubscription_status_idx" ON "StripeSubscription"("status");

-- CreateIndex
CREATE INDEX "StripeSubscription_paymentPlanId_idx" ON "StripeSubscription"("paymentPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeInvoice_stripeInvoiceId_key" ON "StripeInvoice"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeInvoice_paymentId_key" ON "StripeInvoice"("paymentId");

-- CreateIndex
CREATE INDEX "StripeInvoice_stripeCustomerId_idx" ON "StripeInvoice"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StripeInvoice_stripeInvoiceId_idx" ON "StripeInvoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "StripeInvoice_status_idx" ON "StripeInvoice"("status");

-- CreateIndex
CREATE INDEX "StripeInvoice_paymentId_idx" ON "StripeInvoice"("paymentId");

-- CreateIndex
CREATE INDEX "StripeInvoice_dueDate_idx" ON "StripeInvoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_stripeEventId_idx" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_processed_idx" ON "StripeWebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TemplateVersion_templateId_idx" ON "TemplateVersion"("templateId");

-- CreateIndex
CREATE INDEX "TemplateVersion_version_idx" ON "TemplateVersion"("version");

-- CreateIndex
CREATE INDEX "TemplateVersion_performanceScore_idx" ON "TemplateVersion"("performanceScore");

-- CreateIndex
CREATE INDEX "TemplateVersion_createdAt_idx" ON "TemplateVersion"("createdAt");

-- CreateIndex
CREATE INDEX "TemplateImprovement_templateVersionId_idx" ON "TemplateImprovement"("templateVersionId");

-- CreateIndex
CREATE INDEX "TemplateImprovement_improvementType_idx" ON "TemplateImprovement"("improvementType");

-- CreateIndex
CREATE INDEX "TemplateImprovement_accepted_idx" ON "TemplateImprovement"("accepted");

-- CreateIndex
CREATE INDEX "TemplateImprovement_confidence_idx" ON "TemplateImprovement"("confidence");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_templateId_idx" ON "TemplateAnalytics"("templateId");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_metricType_idx" ON "TemplateAnalytics"("metricType");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_periodStart_idx" ON "TemplateAnalytics"("periodStart");

-- CreateIndex
CREATE INDEX "TemplateAnalytics_value_idx" ON "TemplateAnalytics"("value");

-- CreateIndex
CREATE INDEX "AIRecommendation_type_idx" ON "AIRecommendation"("type");

-- CreateIndex
CREATE INDEX "AIRecommendation_category_idx" ON "AIRecommendation"("category");

-- CreateIndex
CREATE INDEX "AIRecommendation_priority_idx" ON "AIRecommendation"("priority");

-- CreateIndex
CREATE INDEX "AIRecommendation_targetEntityType_idx" ON "AIRecommendation"("targetEntityType");

-- CreateIndex
CREATE INDEX "AIRecommendation_targetEntityId_idx" ON "AIRecommendation"("targetEntityId");

-- CreateIndex
CREATE INDEX "AIRecommendation_isExecuted_idx" ON "AIRecommendation"("isExecuted");

-- CreateIndex
CREATE INDEX "AIRecommendation_autoExecutable_idx" ON "AIRecommendation"("autoExecutable");

-- CreateIndex
CREATE INDEX "AIRecommendation_createdAt_idx" ON "AIRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "AIRecommendationAction_recommendationId_idx" ON "AIRecommendationAction"("recommendationId");

-- CreateIndex
CREATE INDEX "AIRecommendationAction_actionType_idx" ON "AIRecommendationAction"("actionType");

-- CreateIndex
CREATE INDEX "AIRecommendationAction_isExecuted_idx" ON "AIRecommendationAction"("isExecuted");

-- CreateIndex
CREATE INDEX "AIRecommendationAction_order_idx" ON "AIRecommendationAction"("order");

-- CreateIndex
CREATE INDEX "AIInsight_type_idx" ON "AIInsight"("type");

-- CreateIndex
CREATE INDEX "AIInsight_entityType_idx" ON "AIInsight"("entityType");

-- CreateIndex
CREATE INDEX "AIInsight_entityId_idx" ON "AIInsight"("entityId");

-- CreateIndex
CREATE INDEX "AIInsight_score_idx" ON "AIInsight"("score");

-- CreateIndex
CREATE INDEX "AIInsight_isAlert_idx" ON "AIInsight"("isAlert");

-- CreateIndex
CREATE INDEX "AIInsight_createdAt_idx" ON "AIInsight"("createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_type_idx" ON "BackgroundJob"("type");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_idx" ON "BackgroundJob"("status");

-- CreateIndex
CREATE INDEX "BackgroundJob_scheduledFor_idx" ON "BackgroundJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "BackgroundJob_priority_idx" ON "BackgroundJob"("priority");

-- CreateIndex
CREATE INDEX "BackgroundJob_parentJobId_idx" ON "BackgroundJob"("parentJobId");

-- CreateIndex
CREATE INDEX "BackgroundJob_createdAt_idx" ON "BackgroundJob"("createdAt");

-- CreateIndex
CREATE INDEX "JobLog_jobId_idx" ON "JobLog"("jobId");

-- CreateIndex
CREATE INDEX "JobLog_level_idx" ON "JobLog"("level");

-- CreateIndex
CREATE INDEX "JobLog_timestamp_idx" ON "JobLog"("timestamp");
