
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth, getUserContext } from '../../../lib/api-utils'
import { getUserPreferences, saveUserPreferences } from '../../../lib/user-session'

export async function GET() {
  try {
    const userContext = await getUserContext()
    
    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user preferences
    const userPreferences = await getUserPreferences(userContext.userId!);

    // System settings (these would normally come from a systemSettings table)
    const systemSettings = [
      { key: 'program_name', value: 'Basketball Factory Training Program', description: 'Program name' },
      { key: 'program_fee', value: '150', description: 'Monthly program fee' },
      { key: 'email_from_address', value: 'khouston@thebasketballfactoryinc.com', description: 'Email from address' },
      { key: 'sms_from_number', value: '+1234567890', description: 'SMS from number' },
      { key: 'reminder_days', value: '3', description: 'Days before due date to send reminder' },
      { key: 'late_fee_amount', value: '25', description: 'Late fee amount' },
      { key: 'grace_period_days', value: '7', description: 'Grace period days' }
    ];

    return NextResponse.json({
      systemSettings,
      userPreferences: {
        theme: userPreferences.theme || 'light',
        emailNotifications: userPreferences.emailNotifications !== false,
        smsNotifications: userPreferences.smsNotifications !== false,
        dashboardLayout: userPreferences.dashboardLayout || 'default',
        defaultView: userPreferences.defaultView || 'dashboard',
        autoSave: userPreferences.autoSave !== false,
        compactMode: userPreferences.compactMode || false,
        ...userPreferences
      },
      user: {
        id: userContext.userId,
        name: userContext.user?.name,
        email: userContext.userEmail,
        role: userContext.userRole,
      }
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const userContext = await getUserContext()
    
    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userPreferences, systemSettings } = body;

    // Save user preferences
    if (userPreferences) {
      await saveUserPreferences(userContext.userId!, userPreferences);
    }

    // System settings would be saved to systemSettings table
    // For now, just log them since the table isn't implemented
    if (systemSettings && userContext.isAdmin) {
      console.log('System settings update requested by admin:', systemSettings);
      // TODO: Implement systemSettings in Convex schema and create mutations
    }

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully',
      updatedPreferences: userPreferences || null,
      updatedSystemSettings: userContext.isAdmin ? systemSettings : null
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
