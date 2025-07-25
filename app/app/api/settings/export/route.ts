export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { getUserContext } from '../../../../lib/api-utils'
import { getUserPreferences, getUserSessionData } from '../../../../lib/user-session'

export async function GET() {
  try {
    const userContext = await getUserContext()
    
    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user preferences and session data
    const userPreferences = await getUserPreferences(userContext.userId!)
    const sessionData = await getUserSessionData(userContext.userId!)

    // Create export data
    const exportData = {
      exportInfo: {
        version: '2.1.0',
        exportDate: new Date().toISOString(),
        userId: userContext.userId,
        userEmail: userContext.userEmail,
      },
      userProfile: {
        name: userContext.user?.name || '',
        email: userContext.userEmail || '',
        role: userContext.userRole || '',
        organization: 'Rise as One Basketball',
      },
      userPreferences: {
        theme: userPreferences.theme || 'system',
        language: userPreferences.language || 'en',
        timezone: userPreferences.timezone || 'America/New_York',
        dateFormat: userPreferences.dateFormat || 'MM/dd/yyyy',
        currency: userPreferences.currency || 'USD',
        notifications: {
          email: userPreferences.emailNotifications !== false,
          sms: userPreferences.smsNotifications !== false,
          push: userPreferences.pushNotifications !== false,
          paymentReminders: userPreferences.paymentReminders !== false,
          overdueAlerts: userPreferences.overdueAlerts !== false,
          systemUpdates: userPreferences.systemUpdates !== false,
          marketingEmails: userPreferences.marketingEmails || false,
        },
        dashboard: {
          defaultView: userPreferences.defaultView || 'overview',
          showWelcomeMessage: userPreferences.showWelcomeMessage !== false,
          compactMode: userPreferences.compactMode || false,
          autoRefresh: userPreferences.autoRefresh !== false,
          refreshInterval: userPreferences.refreshInterval || 30,
        },
        privacy: {
          shareUsageData: userPreferences.shareUsageData || false,
          allowAnalytics: userPreferences.allowAnalytics !== false,
          twoFactorAuth: userPreferences.twoFactorAuth || false,
        },
        ...userPreferences
      },
      sessionData: sessionData || {},
      systemInfo: {
        applicationVersion: 'v2.1.0',
        database: 'Convex',
        environment: process.env.NODE_ENV || 'development',
        features: [
          'notifications',
          'payment-management',
          'ai-reminders',
          'bulk-communication',
          'parent-management',
          'contract-management'
        ]
      }
    }

    // Create the response with proper headers for file download
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rise-as-one-settings-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

    return response

  } catch (error) {
    console.error('Settings export error:', error)
    return NextResponse.json(
      { error: 'Failed to export settings' },
      { status: 500 }
    )
  }
} 