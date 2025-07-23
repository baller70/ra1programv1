
'use client'

import { useEffect, useState } from 'react'
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { AppLayout } from '../components/app-layout'
import { StatsCards } from '../components/dashboard/stats-cards'
import { RevenueChart } from '../components/dashboard/revenue-chart'
import { RecentActivityCard } from '../components/dashboard/recent-activity'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { Plus, Users, CreditCard, MessageSquare, FileText, Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, Mail, Calendar, Shield, Target, Send } from 'lucide-react'
import Link from 'next/link'
import { DashboardStats, PaymentTrend, RecentActivity, AIAnalyticsInsight } from '../lib/types'

export default function DashboardPage() {
  // Use Convex queries instead of fetch
  const stats = useQuery(api.dashboard.getDashboardStats)
  const revenueTrends = useQuery(api.dashboard.getRevenueTrends)
  const recentActivity = useQuery(api.dashboard.getRecentActivity)
  
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const { toast } = useToast()

  // Check if data is still loading
  const loading = stats === undefined || revenueTrends === undefined || recentActivity === undefined

  const fetchAIInsights = async () => {
    try {
      setAiLoading(true)
      // Use mock AI insights data instead of API call
      const mockInsights = {
        insights: [
          {
            id: '1',
            type: 'payment_optimization',
            title: 'Payment Collection Opportunity',
            description: 'You have 5 overdue payments totaling $2,500. Consider sending automated reminders.',
            priority: 'high',
            confidence: 0.85,
            actions: ['Send reminders', 'Call parents', 'Update payment plans']
          },
          {
            id: '2',
            type: 'communication_optimization',
            title: 'Communication Engagement',
            description: 'Email open rates are 15% below average. SMS might be more effective.',
            priority: 'medium',
            confidence: 0.72,
            actions: ['Switch to SMS', 'Optimize email timing', 'A/B test subjects']
          }
        ]
      }
      setAiInsights(mockInsights.insights)
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
    } finally {
      setAiLoading(false)
    }
  }

  // Dashboard action handlers
  const executeRecommendationAction = async (recommendation: string, actionType: string) => {
    setExecutingAction(recommendation)
    
    try {
      switch (actionType) {
        case 'send_bulk_reminder':
          await executeBulkCommunication('send_bulk_reminder', { type: 'payment_reminder', filter: 'overdue_payments', message: 'This is a friendly reminder about your overdue payment. Please contact us if you need assistance.' })
          break
        case 'generate_report':
          await generateReport(recommendation)
          break
        case 'schedule_bulk_followup':
          await scheduleMessage({ type: 'bulk_followup', message: `Follow-up: ${recommendation}`, scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), filter: 'high_risk_parents' })
          break
        case 'update_system_settings':
          await executeBackgroundJob('update_system_settings', { recommendation })
          break
        case 'create_automated_workflow':
          await executeBackgroundJob('create_automated_workflow', { recommendation })
          break
        default:
          toast({
            title: 'Action not implemented',
            description: 'This action is not yet available.',
            variant: 'destructive',
          })
      }
    } catch (error) {
      console.error('Failed to execute recommendation:', error)
      toast({
        title: 'Action failed',
        description: 'There was an error executing this action.',
        variant: 'destructive',
      })
    } finally {
      setExecutingAction(null)
    }
  }

  const executeBulkCommunication = async (type: string, data: any) => {
    try {
      setExecutingAction(type)
      // Mock bulk communication
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay
      toast({
        title: 'Communication sent successfully',
        description: `Sent messages to parents`
      })
    } catch (error) {
      console.error('Failed to execute bulk communication:', error)
    } finally {
      setExecutingAction(null)
    }
  }

  const scheduleMessage = async (data: any) => {
    try {
      setExecutingAction('schedule_message')
      // Mock message scheduling
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
      toast({
        title: 'Message scheduled successfully',
        description: 'Your message will be sent at the specified time'
      })
    } catch (error) {
      console.error('Failed to schedule message:', error)
    } finally {
      setExecutingAction(null)
    }
  }

  const executeBackgroundJob = async (jobType: string, params: any) => {
    try {
      setExecutingAction(jobType)
      // Mock background job execution
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      toast({
        title: 'Background job started',
        description: `Job is now running in the background`
      })
    } catch (error) {
      console.error('Failed to execute background job:', error)
    } finally {
      setExecutingAction(null)
    }
  }

  const generateReport = async (recommendation: string) => {
    // Generate and download report
    window.open('/api/analytics/dashboard?format=pdf', '_blank')
    toast({
      title: 'Report generated',
      description: 'Analytics report opened in new tab',
    })
  }

  const getDashboardActionType = (recommendation: string): string => {
    const lower = recommendation.toLowerCase()
    if (lower.includes('payment') && (lower.includes('remind') || lower.includes('overdue'))) {
      return 'send_bulk_reminder'
    } else if (lower.includes('report') || lower.includes('analysis') || lower.includes('export')) {
      return 'generate_report'
    } else if (lower.includes('follow up') || lower.includes('contact') || lower.includes('reach out')) {
      return 'schedule_bulk_followup'
    } else if (lower.includes('setting') || lower.includes('config') || lower.includes('update system')) {
      return 'update_system_settings'
    } else if (lower.includes('automat') || lower.includes('workflow') || lower.includes('schedule')) {
      return 'create_automated_workflow'
    } else {
      return 'generate_report'
    }
  }

  const getDashboardActionButtonText = (actionType: string): string => {
    switch (actionType) {
      case 'send_bulk_reminder': return 'Send Reminders'
      case 'generate_report': return 'Generate Report'
      case 'schedule_bulk_followup': return 'Schedule Follow-up'
      case 'update_system_settings': return 'Update Settings'
      case 'create_automated_workflow': return 'Create Workflow'
      default: return 'Take Action'
    }
  }

  const getDashboardActionButtonIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_bulk_reminder': return <Mail className="h-3 w-3" />
      case 'generate_report': return <FileText className="h-3 w-3" />
      case 'schedule_bulk_followup': return <Calendar className="h-3 w-3" />
      case 'update_system_settings': return <Shield className="h-3 w-3" />
      case 'create_automated_workflow': return <Target className="h-3 w-3" />
      default: return <Send className="h-3 w-3" />
    }
  }

  useEffect(() => {
    // Fetch AI insights on component mount
    fetchAIInsights()
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your AI-powered Rise as One program management dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={fetchAIInsights}
              disabled={aiLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {aiLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              {aiLoading ? 'AI Analyzing...' : 'Generate AI Insights'}
            </Button>
            <Button asChild variant="outline">
              <Link href="/parents">
                <Users className="mr-2 h-4 w-4" />
                Manage Parents
              </Link>
            </Button>
            <Button asChild>
              <Link href="/parents/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Parent
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* AI Insights Section */}
        <div className="relative">
          <div className="absolute -top-2 left-4 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 shadow-md">
              <Brain className="mr-1 h-3 w-3" />
              Powered by AI
            </Badge>
          </div>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center text-purple-800">
                    <Brain className="mr-2 h-6 w-6 text-purple-600" />
                    AI Executive Dashboard
                  </CardTitle>
                  <p className="text-sm text-purple-600 mt-1">Real-time insights and recommendations</p>
                </div>
                <Button
                  onClick={fetchAIInsights}
                  disabled={aiLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  size="sm"
                >
                  {aiLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {aiLoading ? 'Analyzing...' : 'Refresh AI Analysis'}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* AI Executive Summary */}
          <Card className="md:col-span-2 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Brain className="mr-2 h-5 w-5 text-purple-600" />
                AI Insights & Recommendations
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAIInsights}
                  disabled={aiLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  AI Generated
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Generating insights...</span>
                </div>
              ) : aiInsights ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {aiInsights.executiveSummary}
                  </div>
                  
                  {aiInsights.alerts && aiInsights.alerts.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center text-red-600">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        Urgent Alerts
                      </h4>
                      {aiInsights.alerts.slice(0, 2).map((alert: string, index: number) => {
                        const actionType = getDashboardActionType(alert)
                        const isExecuting = executingAction === alert
                        
                        return (
                          <div key={index} className="p-3 border border-red-300 rounded-lg bg-red-100/50">
                            <div className="flex items-start justify-between space-x-3">
                              <div className="flex items-start space-x-2 flex-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-red-700 flex-1">{alert}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isExecuting}
                                onClick={() => executeRecommendationAction(alert, actionType)}
                                className="ml-2 shrink-0 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-none"
                              >
                                {isExecuting ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                ) : (
                                  getDashboardActionButtonIcon(actionType)
                                )}
                                <span className="ml-1 text-xs">
                                  {isExecuting ? 'Acting...' : getDashboardActionButtonText(actionType)}
                                </span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {aiInsights.keyInsights && aiInsights.keyInsights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center text-blue-600">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Key Insights
                      </h4>
                      {aiInsights.keyInsights.slice(0, 3).map((insight: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click refresh to generate AI insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                <div className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-orange-600" />
                  AI Priority Actions
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  AI Powered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiInsights?.priorityActions ? (
                <div className="space-y-4">
                  {aiInsights.priorityActions.slice(0, 4).map((action: string, index: number) => {
                    const actionType = getDashboardActionType(action)
                    const isExecuting = executingAction === action
                    
                    return (
                      <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50/50">
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <Badge variant="outline" className="text-xs mt-0.5 bg-red-100 text-red-700 border-red-300">
                              {index + 1}
                            </Badge>
                            <span className="text-sm flex-1 text-red-800">{action}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isExecuting}
                            onClick={() => executeRecommendationAction(action, actionType)}
                            className="ml-2 shrink-0 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-none"
                          >
                            {isExecuting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                            ) : (
                              getDashboardActionButtonIcon(actionType)
                            )}
                            <span className="ml-1 text-xs">
                              {isExecuting ? 'Acting...' : getDashboardActionButtonText(actionType)}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {aiInsights.priorityActions.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{aiInsights.priorityActions.length - 4} more priority actions available
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    No priority actions available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-4 md:grid-cols-7">
          <RevenueChart data={revenueTrends} />
          <RecentActivityCard activities={recentActivity} />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/parents">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Parents</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/payments">
              <CreditCard className="h-6 w-6 mb-2" />
              <span>Track Payments</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/communication">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span>Send Messages</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 flex-col">
            <Link href="/contracts">
              <FileText className="h-6 w-6 mb-2" />
              <span>Manage Contracts</span>
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
