import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '+1234567890'; // Replace with your Twilio number

// Template rendering function
export function renderSmsTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  // Replace variables in format {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  
  return rendered;
}

// Send single SMS
export async function sendSms({
  to,
  message,
  from = FROM_NUMBER,
  metadata,
}: {
  to: string;
  message: string;
  from?: string;
  metadata?: Record<string, string>;
}) {
  try {
    // Clean phone number (remove non-digits except +)
    const cleanTo = to.replace(/[^\d+]/g, '');
    
    // Ensure phone number has country code
    const phoneNumber = cleanTo.startsWith('+') ? cleanTo : `+1${cleanTo}`;

    const result = await client.messages.create({
      body: message,
      from: from,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      result,
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

// Send bulk SMS messages
export async function sendBulkSms({
  messages,
  batchSize = 100,
}: {
  messages: Array<{
    to: string;
    message: string;
    metadata?: Record<string, string>;
  }>;
  batchSize?: number;
}) {
  const results: Array<{
    success: boolean;
    phone: string;
    messageId?: string;
    error?: string;
  }> = [];

  // Process messages in batches to avoid rate limits
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (messageData) => {
      const result = await sendSms({
        to: messageData.to,
        message: messageData.message,
        metadata: messageData.metadata,
      });
      
      return {
        success: result.success,
        phone: messageData.to,
        messageId: result.messageId,
        error: result.error,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: failed === 0,
    total: messages.length,
    successful,
    failed,
    results,
  };
}

// Send templated SMS
export async function sendTemplatedSms({
  to,
  templateId,
  variables,
  metadata,
}: {
  to: string;
  templateId: string;
  variables: Record<string, any>;
  metadata?: Record<string, string>;
}) {
  try {
    // Get template from database (assuming we have a template system)
    const template = await getSmsTemplate(templateId);
    
    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} not found`,
      };
    }

    const renderedMessage = renderSmsTemplate(template.content, variables);

    return await sendSms({
      to,
      message: renderedMessage,
      metadata: {
        templateId,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Templated SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send templated SMS',
    };
  }
}

// Send bulk templated SMS
export async function sendBulkTemplatedSms({
  recipients,
  templateId,
  batchSize = 100,
}: {
  recipients: Array<{
    phone: string;
    variables: Record<string, any>;
    metadata?: Record<string, string>;
  }>;
  templateId: string;
  batchSize?: number;
}) {
  try {
    // Get template from database
    const template = await getSmsTemplate(templateId);
    
    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} not found`,
      };
    }

    // Prepare messages with rendered content
    const messages = recipients.map(recipient => {
      const renderedMessage = renderSmsTemplate(template.content, recipient.variables);

      return {
        to: recipient.phone,
        message: renderedMessage,
        metadata: {
          templateId,
          ...recipient.metadata,
        },
      };
    });

    return await sendBulkSms({ messages, batchSize });
  } catch (error) {
    console.error('Bulk templated SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send bulk templated SMS',
    };
  }
}

// Payment reminder SMS
export async function sendPaymentReminderSms({
  parentPhone,
  parentName,
  amount,
  dueDate,
  daysPastDue = 0,
}: {
  parentPhone: string;
  parentName: string;
  amount: number;
  dueDate: Date;
  daysPastDue?: number;
}) {
  const isOverdue = daysPastDue > 0;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  let message;
  if (isOverdue) {
    message = `OVERDUE: Hi ${parentName}, your payment of ${formattedAmount} was due ${formattedDueDate} (${daysPastDue} days ago). Please pay ASAP to avoid program interruption. Rise as One Basketball. Reply STOP to opt out.`;
  } else {
    message = `Hi ${parentName}, reminder: your payment of ${formattedAmount} is due ${formattedDueDate}. Thank you! Rise as One Basketball. Reply STOP to opt out.`;
  }

  return await sendSms({
    to: parentPhone,
    message,
    metadata: {
      type: 'payment_reminder',
      amount: amount.toString(),
      dueDate: dueDate.toISOString(),
      isOverdue: isOverdue.toString(),
      daysPastDue: daysPastDue.toString(),
    },
  });
}

// Welcome SMS for new parents
export async function sendWelcomeSms({
  parentPhone,
  parentName,
}: {
  parentPhone: string;
  parentName: string;
}) {
  const message = `Welcome ${parentName}! Your child is now enrolled in Rise as One Basketball Program. You'll receive updates and payment reminders via SMS. Questions? Contact us. Reply STOP to opt out.`;

  return await sendSms({
    to: parentPhone,
    message,
    metadata: {
      type: 'welcome',
    },
  });
}

// Practice reminder SMS
export async function sendPracticeReminderSms({
  parentPhone,
  parentName,
  practiceDate,
  practiceTime,
  location,
}: {
  parentPhone: string;
  parentName: string;
  practiceDate: Date;
  practiceTime: string;
  location: string;
}) {
  const formattedDate = practiceDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const message = `Hi ${parentName}, reminder: Basketball practice ${formattedDate} at ${practiceTime}. Location: ${location}. Rise as One Basketball. Reply STOP to opt out.`;

  return await sendSms({
    to: parentPhone,
    message,
    metadata: {
      type: 'practice_reminder',
      practiceDate: practiceDate.toISOString(),
      practiceTime,
      location,
    },
  });
}

// Game reminder SMS
export async function sendGameReminderSms({
  parentPhone,
  parentName,
  gameDate,
  gameTime,
  opponent,
  location,
}: {
  parentPhone: string;
  parentName: string;
  gameDate: Date;
  gameTime: string;
  opponent: string;
  location: string;
}) {
  const formattedDate = gameDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const message = `Hi ${parentName}, GAME DAY! ${formattedDate} at ${gameTime} vs ${opponent}. Location: ${location}. Go team! Rise as One Basketball. Reply STOP to opt out.`;

  return await sendSms({
    to: parentPhone,
    message,
    metadata: {
      type: 'game_reminder',
      gameDate: gameDate.toISOString(),
      gameTime,
      opponent,
      location,
    },
  });
}

// Check SMS delivery status
export async function getSmsDeliveryStatus(messageId: string) {
  try {
    const message = await client.messages(messageId).fetch();
    
    return {
      messageId,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
    };
  } catch (error) {
    console.error('SMS status check error:', error);
    return {
      messageId,
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Failed to check status',
    };
  }
}

// Handle SMS webhooks (for delivery status and replies)
export async function handleSmsWebhook(webhookData: any) {
  try {
    const {
      MessageSid,
      MessageStatus,
      From,
      To,
      Body,
      ErrorCode,
      ErrorMessage,
    } = webhookData;

    // Handle delivery status updates
    if (MessageStatus) {
      console.log(`SMS ${MessageSid} status: ${MessageStatus}`);
      
      // You would typically update your database here
      // await updateMessageStatus(MessageSid, MessageStatus, ErrorCode, ErrorMessage);
    }

    // Handle incoming SMS replies
    if (Body) {
      console.log(`Incoming SMS from ${From}: ${Body}`);
      
      // Handle STOP requests
      if (Body.toUpperCase().includes('STOP')) {
        console.log(`Opt-out request from ${From}`);
        // You would typically update your database to mark this number as opted out
        // await markPhoneAsOptedOut(From);
      }
    }

    return {
      success: true,
      processed: true,
    };
  } catch (error) {
    console.error('SMS webhook handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to handle webhook',
    };
  }
}

// Validate phone number format
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  try {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it's empty
    if (!cleaned) {
      return {
        isValid: false,
        error: 'Phone number is required',
      };
    }

    // Check if it starts with + (international format)
    if (cleaned.startsWith('+')) {
      if (cleaned.length < 10) {
        return {
          isValid: false,
          error: 'Phone number is too short',
        };
      }
      return {
        isValid: true,
        formatted: cleaned,
      };
    }

    // Assume US number if no country code
    if (cleaned.length === 10) {
      return {
        isValid: true,
        formatted: `+1${cleaned}`,
      };
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return {
        isValid: true,
        formatted: `+${cleaned}`,
      };
    }

    return {
      isValid: false,
      error: 'Invalid phone number format',
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate phone number',
    };
  }
}

// Get SMS usage statistics
export async function getSmsUsageStats() {
  try {
    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await client.usage.records.list({
      category: 'sms',
      startDate: startOfMonth,
      endDate: now,
    });

    const totalMessages = usage.reduce((sum, record) => sum + parseInt(record.count || '0'), 0);
    const totalCost = usage.reduce((sum, record) => sum + parseFloat(record.price || '0'), 0);

    return {
      success: true,
      period: {
        start: startOfMonth,
        end: now,
      },
      usage: {
        totalMessages,
        totalCost,
        averageCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
      },
    };
  } catch (error) {
    console.error('SMS usage stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage stats',
    };
  }
}

// Helper function to get SMS template from database
async function getSmsTemplate(templateId: string) {
  // This would typically fetch from your database
  // For now, return a basic template structure
  const templates: Record<string, { content: string }> = {
    'payment_reminder': {
      content: 'Hi {{parentName}}, your payment of {{amount}} is due {{dueDate}}. Rise as One Basketball. Reply STOP to opt out.',
    },
    'welcome': {
      content: 'Welcome {{parentName}}! Your child is enrolled in Rise as One Basketball. Reply STOP to opt out.',
    },
    'practice_reminder': {
      content: 'Hi {{parentName}}, practice reminder: {{date}} at {{time}}. Location: {{location}}. Reply STOP to opt out.',
    },
    'game_reminder': {
      content: 'Hi {{parentName}}, GAME DAY! {{date}} at {{time}} vs {{opponent}}. Location: {{location}}. Reply STOP to opt out.',
    },
  };

  return templates[templateId] || null;
}

// Utility functions
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function truncateMessage(message: string, maxLength: number = 160): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.slice(0, maxLength - 3) + '...';
} 