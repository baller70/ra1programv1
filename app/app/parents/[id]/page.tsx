
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '../../../components/app-layout'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'
import { useToast } from '../../../hooks/use-toast'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  CreditCard,
  MessageSquare,
  Calendar,
  DollarSign,
  Brain,
  AlertTriangle,
  TrendingUp,
  Target,
  RefreshCw,
  Shield,
  Lightbulb,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { ParentWithRelations } from '../../../lib/types'

export default function ParentProfilePage() {
  const params = useParams()
  const parentId = params?.id as string
  const [parent, setParent] = useState<ParentWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchParent = async () => {
      try {
        const response = await fetch(`/api/parents/${parentId}`)
        if (response.ok) {
          const data = await response.json()
          setParent(data)
        }
      } catch (error) {
        console.error('Failed to fetch parent:', error)
      } finally {
        setLoading(false)
      }
    }

    if (parentId) {
      fetchParent()
    }
  }, [parentId])

  const fetchAIAnalysis = async () => {
    if (!parentId) return

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/analyze-parent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parentId })
      })

      if (response.ok) {
        const data = await response.json()
        // Extract analysis from the correct structure
        if (data.success && data.results && data.results.length > 0) {
          setAiAnalysis(data.results[0].analysis)
        } else {
          console.error('No analysis results found:', data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI analysis:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!messageContent.trim() || !parentId) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId,
          message: messageContent,
          type: 'manual'
        })
      })

      if (response.ok) {
        toast({
          title: 'Message sent successfully',
          description: `Message sent to ${parent?.name}`,
        })
        setMessageContent('')
        setShowMessageDialog(false)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: 'Failed to send message',
        description: 'There was an error sending the message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const generateAIMessage = async () => {
    if (!parentId || !parent) return

    setSendingMessage(true)
    try {
      // Generate AI message based on parent data and analysis
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId,
          parentName: parent.name,
          context: {
            riskLevel: aiAnalysis?.riskLevel || 'unknown',
            riskScore: aiAnalysis?.riskScore || 0,
            paymentStatus: parent.payments?.length > 0 ? 'has_payments' : 'no_payments',
            overduePayments: parent.payments?.filter(p => new Date(p.dueDate) < new Date()).length || 0,
            contractStatus: parent.contractStatus,
            recentCommunications: parent.messageLogs?.length || 0,
            keyInsights: aiAnalysis?.keyInsights || [],
            recommendations: aiAnalysis?.recommendations || []
          },
          messageType: 'personalized_check_in'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.message) {
          // Handle the message structure (it has subject and body)
          const messageText = data.message.body || data.message
          setMessageContent(messageText)
          setShowMessageDialog(true)
          toast({
            title: 'AI message generated',
            description: 'Personalized message created based on parent analysis',
          })
        } else {
          throw new Error('No message generated')
        }
      } else {
        throw new Error('Failed to generate AI message')
      }
    } catch (error) {
      console.error('Failed to generate AI message:', error)
      toast({
        title: 'Failed to generate message',
        description: 'Could not generate AI message. Opening empty dialog instead.',
        variant: 'destructive',
      })
      // Fallback to empty dialog
      setMessageContent('')
      setShowMessageDialog(true)
    } finally {
      setSendingMessage(false)
    }
  }

  // Recommendation action handlers
  const executeRecommendationAction = async (recommendation: string, actionType: string) => {
    setExecutingAction(recommendation)
    
    try {
      switch (actionType) {
        case 'send_reminder':
          await sendPaymentReminder()
          break
        case 'send_message':
          setMessageContent(`Hi ${parent?.name}, ${recommendation}`)
          setShowMessageDialog(true)
          break
        case 'create_payment_plan':
          await createPaymentPlan()
          break
        case 'schedule_followup':
          await scheduleFollowup(recommendation)
          break
        case 'update_risk_status':
          await updateRiskStatus()
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

  const sendPaymentReminder = async () => {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId,
        message: `Hi ${parent?.name}, this is a friendly reminder about your upcoming payment. Please let us know if you need any assistance.`,
        type: 'payment_reminder'
      })
    })

    if (response.ok) {
      toast({
        title: 'Payment reminder sent',
        description: `Payment reminder sent to ${parent?.name}`,
      })
    } else {
      throw new Error('Failed to send payment reminder')
    }
  }

  const createPaymentPlan = async () => {
    // Navigate to payment plan creation
    window.open(`/parents/${parentId}/payment-plan/new`, '_blank')
    toast({
      title: 'Opening payment plan creator',
      description: 'Payment plan creation page opened in new tab',
    })
  }

  const scheduleFollowup = async (recommendation: string) => {
    const response = await fetch('/api/messages/scheduled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId,
        message: `Follow-up: ${recommendation}`,
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        type: 'followup'
      })
    })

    if (response.ok) {
      toast({
        title: 'Follow-up scheduled',
        description: 'Follow-up message scheduled for next week',
      })
    } else {
      throw new Error('Failed to schedule follow-up')
    }
  }

  const updateRiskStatus = async () => {
    const response = await fetch(`/api/parents/${parentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        riskLevel: aiAnalysis?.riskLevel,
        lastRiskAssessment: new Date()
      })
    })

    if (response.ok) {
      toast({
        title: 'Risk status updated',
        description: 'Parent risk status has been updated',
      })
    } else {
      throw new Error('Failed to update risk status')
    }
  }

  const getRecommendationActionType = (recommendation: string): string => {
    const lower = recommendation.toLowerCase()
    if (lower.includes('payment') && (lower.includes('remind') || lower.includes('overdue'))) {
      return 'send_reminder'
    } else if (lower.includes('payment plan') || lower.includes('installment')) {
      return 'create_payment_plan'
    } else if (lower.includes('follow up') || lower.includes('contact') || lower.includes('call')) {
      return 'schedule_followup'
    } else if (lower.includes('risk') || lower.includes('status')) {
      return 'update_risk_status'
    } else {
      return 'send_message'
    }
  }

  const getActionButtonText = (actionType: string): string => {
    switch (actionType) {
      case 'send_reminder': return 'Send Reminder'
      case 'send_message': return 'Send Message'
      case 'create_payment_plan': return 'Create Plan'
      case 'schedule_followup': return 'Schedule Follow-up'
      case 'update_risk_status': return 'Update Status'
      default: return 'Take Action'
    }
  }

  const getActionButtonIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_reminder': return <Mail className="h-3 w-3" />
      case 'send_message': return <MessageSquare className="h-3 w-3" />
      case 'create_payment_plan': return <CreditCard className="h-3 w-3" />
      case 'schedule_followup': return <Calendar className="h-3 w-3" />
      case 'update_risk_status': return <Shield className="h-3 w-3" />
      default: return <Target className="h-3 w-3" />
    }
  }

  // Auto-fetch AI analysis when parent is loaded
  useEffect(() => {
    if (parent && !aiAnalysis) {
      fetchAIAnalysis()
    }
  }, [parent])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!parent) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Parent Not Found</h1>
          <p className="text-muted-foreground mb-4">The parent you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/parents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Parents
            </Link>
          </Button>
        </div>
      </AppLayout>
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'suspended': return 'destructive'
      default: return 'outline'
    }
  }

  const getContractStatusVariant = (status: string) => {
    switch (status) {
      case 'signed': return 'default'
      case 'pending': return 'secondary'
      case 'expired': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/parents">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Parents
              </Link>
            </Button>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {parent.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="absolute -top-1 -right-1">
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 text-xs">
                    <Brain className="mr-1 h-3 w-3" />
                    AI
                  </Badge>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{parent.name}</h1>
                <p className="text-muted-foreground">AI-Enhanced Parent Profile</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusVariant(parent.status)}>
                    {parent.status}
                  </Badge>
                  <Badge variant={getContractStatusVariant(parent.contractStatus)}>
                    Contract: {parent.contractStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={fetchAIAnalysis}
              disabled={aiLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              {aiLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              {aiLoading ? 'AI Analyzing...' : 'AI Analysis'}
            </Button>
            <Button variant="outline" onClick={generateAIMessage} disabled={sendingMessage}>
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              {sendingMessage ? 'Generating...' : 'Send Message'}
            </Button>
            <Button asChild>
              <Link href={`/parents/${parent.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Parent
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{parent.email}</p>
                </div>
              </div>
              {parent.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{parent.phone}</p>
                  </div>
                </div>
              )}
              {parent.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{parent.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parent.emergencyContact && (
                <div>
                  <p className="text-sm font-medium">Contact Person</p>
                  <p className="text-sm text-muted-foreground">{parent.emergencyContact}</p>
                </div>
              )}
              {parent.emergencyPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Emergency Phone</p>
                    <p className="text-sm text-muted-foreground">{parent.emergencyPhone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Status */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={getContractStatusVariant(parent.contractStatus)}>
                    {parent.contractStatus}
                  </Badge>
                </div>
              </div>
              {parent.contractUploadedAt && (
                <div>
                  <p className="text-sm font-medium">Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(parent.contractUploadedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {parent.contractExpiresAt && (
                <div>
                  <p className="text-sm font-medium">Expires</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(parent.contractExpiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Risk Assessment */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Brain className="mr-2 h-4 w-4 text-purple-600" />
                AI Risk Assessment
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAIAnalysis}
                disabled={aiLoading}
              >
                <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Analyzing...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Risk Level</span>
                    </div>
                    <Badge 
                      variant={
                        aiAnalysis.riskLevel === 'high' ? 'destructive' : 
                        aiAnalysis.riskLevel === 'medium' ? 'secondary' : 'default'
                      }
                    >
                      {aiAnalysis.riskLevel?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Score</span>
                      <span className="font-medium">{aiAnalysis.riskScore || 0}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (aiAnalysis.riskScore || 0) > 70 ? 'bg-red-500' : 
                          (aiAnalysis.riskScore || 0) > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(aiAnalysis.riskScore || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Prediction</span>
                      <span className="font-medium">{aiAnalysis.paymentPrediction || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Engagement Score</span>
                      <span className="font-medium">{aiAnalysis.engagementScore || 0}/100</span>
                    </div>
                  </div>

                  {aiAnalysis.keyInsights && aiAnalysis.keyInsights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Key Insights
                      </h4>
                      {aiAnalysis.keyInsights.slice(0, 3).map((insight: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
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
                    Click refresh to generate AI analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Lightbulb className="mr-2 h-4 w-4 text-orange-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiAnalysis?.recommendations ? (
                <div className="space-y-4">
                  {aiAnalysis.recommendations.slice(0, 4).map((recommendation: string, index: number) => {
                    const actionType = getRecommendationActionType(recommendation)
                    const isExecuting = executingAction === recommendation
                    
                    return (
                      <div key={index} className="p-3 border border-orange-200 rounded-lg bg-white/50">
                        <div className="flex items-start justify-between space-x-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <Badge variant="outline" className="text-xs mt-0.5">
                              {index + 1}
                            </Badge>
                            <span className="text-sm flex-1">{recommendation}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isExecuting}
                            onClick={() => executeRecommendationAction(recommendation, actionType)}
                            className="ml-2 shrink-0 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-none"
                          >
                            {isExecuting ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                            ) : (
                              getActionButtonIcon(actionType)
                            )}
                            <span className="ml-1 text-xs">
                              {isExecuting ? 'Acting...' : getActionButtonText(actionType)}
                            </span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  
                  {aiAnalysis.priorityActions && aiAnalysis.priorityActions.length > 0 && (
                    <div className="pt-3 border-t border-orange-200">
                      <h4 className="text-xs font-semibold text-red-600 mb-3 flex items-center">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Priority Actions
                      </h4>
                      {aiAnalysis.priorityActions.slice(0, 2).map((action: string, index: number) => {
                        const actionType = getRecommendationActionType(action)
                        const isExecuting = executingAction === action
                        
                        return (
                          <div key={index} className="p-3 mb-2 border border-red-200 rounded-lg bg-red-50/50">
                            <div className="flex items-start justify-between space-x-3">
                              <div className="flex items-start space-x-2 flex-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-xs text-red-700 flex-1">{action}</span>
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
                                  getActionButtonIcon(actionType)
                                )}
                                <span className="ml-1 text-xs">
                                  {isExecuting ? 'Acting...' : getActionButtonText(actionType)}
                                </span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    AI recommendations will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parent.paymentPlans && parent.paymentPlans.length > 0 ? (
              <div className="space-y-4">
                {parent.paymentPlans.map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{plan.type} Payment Plan</p>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number(plan.totalAmount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(plan.installmentAmount).toLocaleString()} x {plan.installments}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payment plans found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parent.payments && parent.payments.length > 0 ? (
              <div className="space-y-3">
                {parent.payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">${Number(payment.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payment records found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {parent.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{parent.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Generated Message for {parent?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              This message was personalized based on {parent?.name}'s profile, payment history, and AI analysis. 
              You can edit it before sending.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="AI-generated message will appear here..."
              rows={6}
              className="min-h-[120px]"
            />
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={generateAIMessage} 
                disabled={sendingMessage}
                size="sm"
              >
                <Brain className="mr-2 h-3 w-3" />
                Regenerate AI Message
              </Button>
              <Button onClick={sendMessage} disabled={sendingMessage || !messageContent.trim()}>
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
