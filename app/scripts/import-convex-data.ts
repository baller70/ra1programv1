import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function importData() {
  try {
    const parentsData = require('../convex-data-parents.json');
    console.log('Importing parents data...');
    
    for (const parent of parentsData) {
      await client.mutation("parents:createParent", {
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        status: parent.status || 'active'
      });
    }
    
    const paymentPlansData = require('../convex-data-paymentPlans.json');
    console.log('Importing payment plans data...');
    
    for (const plan of paymentPlansData) {
      await client.mutation("paymentPlans:createPaymentPlan", {
        parentId: plan.parentId,
        type: plan.type,
        totalAmount: plan.totalAmount,
        installmentAmount: plan.installmentAmount,
        installments: plan.installments,
        startDate: new Date(plan.startDate).getTime(),
        status: plan.status,
        description: plan.description
      });
    }
    
    const paymentsData = require('../convex-data-payments.json');
    console.log('Importing payments data...');
    
    for (const payment of paymentsData) {
      await client.mutation("payments:createPayment", {
        parentId: payment.parentId,
        paymentPlanId: payment.paymentPlanId,
        amount: payment.amount,
        dueDate: new Date(payment.dueDate).getTime(),
        notes: payment.notes
      });
    }
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

importData();
