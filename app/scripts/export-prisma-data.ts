import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function exportAllData() {
  console.log('🚀 Starting Prisma data export...');
  
  try {
    // Export all tables with correct Prisma model names
    const exportData = {
      // Auth tables
      users: await prisma.user.findMany(),
      accounts: await prisma.account.findMany(),
      sessions: await prisma.session.findMany(),
      verificationTokens: await prisma.verificationToken.findMany(),
      
      // Core application tables
      teams: await prisma.team.findMany(),
      parents: await prisma.parent.findMany(),
      paymentPlans: await prisma.paymentPlan.findMany(),
      payments: await prisma.payment.findMany(),
      templates: await prisma.template.findMany(),
      messageLogs: await prisma.messageLog.findMany(),
      contracts: await prisma.contract.findMany(),
      scheduledMessages: await prisma.scheduledMessage.findMany(),
      paymentReminders: await prisma.paymentReminder.findMany(),
      
      // System tables
      systemSettings: await prisma.systemSettings.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      
      // Recurring messages
      recurringMessages: await prisma.recurringMessage.findMany(),
      recurringInstances: await prisma.recurringInstance.findMany(),
      recurringRecipients: await prisma.recurringRecipient.findMany(),
      recurringMessageLogs: await prisma.recurringMessageLog.findMany(),
      
      // Stripe integration
      stripeCustomers: await prisma.stripeCustomer.findMany(),
      stripePaymentMethods: await prisma.stripePaymentMethod.findMany(),
      stripeSubscriptions: await prisma.stripeSubscription.findMany(),
      stripeInvoices: await prisma.stripeInvoice.findMany(),
      stripeWebhookEvents: await prisma.stripeWebhookEvent.findMany(),
      
      // AI templates
      templateVersions: await prisma.templateVersion.findMany(),
      templateImprovements: await prisma.templateImprovement.findMany(),
      templateAnalytics: await prisma.templateAnalytics.findMany(),
      
      // AI recommendations
      aiRecommendations: await prisma.aIRecommendation.findMany(),
      aiRecommendationActions: await prisma.aIRecommendationAction.findMany(),
      aiInsights: await prisma.aIInsight.findMany(),
      
      // Background jobs
      backgroundJobs: await prisma.backgroundJob.findMany(),
      jobLogs: await prisma.jobLog.findMany(),
    };

    // Log counts
    console.log('\n📊 Data export summary:');
    Object.entries(exportData).forEach(([table, data]) => {
      console.log(`  ${table}: ${Array.isArray(data) ? data.length : 0} records`);
    });

    // Write to file
    const exportPath = join(process.cwd(), 'migration-data.json');
    writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Data exported successfully to: ${exportPath}`);
    console.log('\n📋 Migration Summary:');
    
    let totalRecords = 0;
    Object.values(exportData).forEach(data => {
      if (Array.isArray(data)) totalRecords += data.length;
    });
    
    console.log(`  Total records exported: ${totalRecords}`);
    console.log(`  Total tables: ${Object.keys(exportData).length}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export individual table
export async function exportTable(tableName: string) {
  try {
    const data = await (prisma as any)[tableName].findMany();
    console.log(`Exported ${data.length} records from ${tableName}`);
    return data;
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    return [];
  }
}

// Main execution
if (require.main === module) {
  exportAllData()
    .then(() => {
      console.log('\n🎉 Export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Export failed:', error);
      process.exit(1);
    });
}

export { exportAllData }; 