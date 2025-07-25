export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { getUserContext } from '../../../../lib/api-utils'
import { saveUserPreferences } from '../../../../lib/user-session'

export async function POST() {
  try {
    const userContext = await getUserContext()
    
    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Default user preferences
    const defaultPreferences = {
      theme: 'system',
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
      currency: 'USD',
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      paymentReminders: true,
      overdueAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
      defaultView: 'overview',
      showWelcomeMessage: true,
      compactMode: false,
      autoRefresh: true,
      refreshInterval: 30,
      shareUsageData: false,
      allowAnalytics: true,
      twoFactorAuth: false,
    }

    // Save default preferences
    await saveUserPreferences(userContext.userId!, defaultPreferences)

    return NextResponse.json({ 
      success: true,
      message: 'Settings have been reset to defaults',
      defaultPreferences
    })

  } catch (error) {
    console.error('Settings reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    )
  }
} 