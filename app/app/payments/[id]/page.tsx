'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { useToast } from '../../../hooks/use-toast'
import { 
  CreditCard, 
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidAt: string | null
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  remindersSent: number
  notes: string | null
  parent: {
    id: string
    name: string
    email: string
    phone?: string
    contracts?: Array<{
      id: string
      originalName: string
      fileName: string
      status: 'signed' | 'pending' | 'expired'
      signedAt: string | null
      uploadedAt: string
      expiresAt: string | null
      templateType: string | null
    }>
  } | null
  paymentPlan: {
    id: string
    type: string
    totalAmount: number
    installmentAmount: number
    description?: string
  } | null
  reminders?: Array<{
    id: string
    reminderType: string
    scheduledFor: string
    status: string
  }>
}

interface PaymentHistory {
  id: string
  action: string
  description: string
  performedBy: string
  performedAt: string
  amount?: number
  status?: string
  metadata?: any
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'overdue':
      return 'destructive'
    case 'cancelled':
      return 'outline'
    default:
      return 'secondary'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-5 w-5" />
    case 'pending':
      return <Clock className="h-5 w-5" />
    case 'overdue':
      return <AlertTriangle className="h-5 w-5" />
    case 'cancelled':
      return <Eye className="h-5 w-5" />
    default:
      return <Clock className="h-5 w-5" />
  }
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentDetails()
    fetchPaymentHistory()
  }, [params.id])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payments/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Payment not found')
        } else {
          setError('Failed to load payment details')
        }
        return
      }

      const data = await response.json()
      setPayment(data)
    } catch (error) {
      console.error('Error fetching payment:', error)
      setError('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch(`/api/payments/${params.id}/history`)
      
      if (response.ok) {
        const data = await response.json()
        setPaymentHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!payment) return
    
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() })
      })

      if (response.ok) {
        const updatedPayment = await response.json()
        setPayment(updatedPayment)
        // Refresh payment history after marking as paid
        fetchPaymentHistory()
        toast({
          title: 'Payment marked as paid!',
          description: `Payment ID: ${payment.id} has been marked as paid.`,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error marking as paid',
          description: errorData.message || 'Failed to mark payment as paid.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      toast({
        title: 'Error marking as paid',
        description: 'Failed to mark payment as paid due to an unexpected error.',
        variant: 'destructive',
      })
    }
  }

  const handleSendReminder = async () => {
    if (!payment || !payment.parent?.id) return
    
    try {
      setSendingReminder(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [payment.parent.id], // Send as array
          subject: 'Payment Reminder',
          body: `Dear ${payment.parent.name},\n\nThis is a friendly reminder that you have a payment of $${payment.amount} due on ${new Date(payment.dueDate).toLocaleDateString()}.\n\nPlease contact us if you have any questions.\n\nThank you!`,
          channel: 'email',
          variables: {
            parentName: payment.parent.name,
            amount: payment.amount,
            dueDate: new Date(payment.dueDate).toLocaleDateString(),
            paymentId: payment.id
          }
        })
      })

      if (response.ok) {
        // Refresh payment details and history after sending reminder
        fetchPaymentDetails()
        fetchPaymentHistory()
        
        // Show success toast
        toast({
          title: 'Reminder sent successfully',
          description: `Payment reminder sent to ${payment.parent.name}`,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send reminder')
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: 'Failed to send reminder',
        description: error instanceof Error ? error.message : 'There was an error sending the payment reminder.',
        variant: 'destructive',
      })
    } finally {
      setSendingReminder(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || 'The payment you are looking for does not exist.'}
              </p>
              <Button asChild>
                <Link href="/payments">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Payments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const daysOverdue = payment.status === 'overdue' 
    ? Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Payment Details
              <Badge variant={getStatusVariant(payment.status)} className="text-sm">
                {getStatusIcon(payment.status)}
                <span className="ml-1 capitalize">{payment.status}</span>
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Payment ID: {payment.id}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {payment.status === 'pending' && (
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </Button>
          )}
          {payment.status !== 'paid' && (
            <Button variant="outline" onClick={handleSendReminder} disabled={sendingReminder}>
              <Bell className="mr-2 h-4 w-4" />
              {sendingReminder ? 'Sending...' : 'Send Reminder'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Payment Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-green-600">
                    ${Number(payment.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700">Payment Amount</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-xl font-bold text-blue-600">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-blue-700">Due Date</p>
                  {payment.status === 'overdue' && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      {daysOverdue} days overdue
                    </p>
                  )}
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Bell className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-xl font-bold text-purple-600">
                    {payment.remindersSent}
                  </p>
                  <p className="text-sm text-purple-700">Reminders Sent</p>
                </div>
              </div>
              
              {payment.paidAt && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Payment Completed</span>
                  </div>
                  <p className="text-green-700">
                    Paid on {new Date(payment.paidAt).toLocaleDateString()} at {new Date(payment.paidAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
              
              {payment.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Payment Notes</label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Plan Information */}
          {payment.paymentPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plan Type</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize text-base px-3 py-1">
                        {payment.paymentPlan.type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Plan Amount</label>
                    <p className="text-xl font-semibold mt-1">
                      ${Number(payment.paymentPlan.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Installment Amount</label>
                  <p className="text-lg font-semibold mt-1">
                    ${Number(payment.paymentPlan.installmentAmount).toLocaleString()}
                  </p>
                </div>
                {payment.paymentPlan.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plan Description</label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded">
                      {payment.paymentPlan.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                Track of all payment-related activities and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((entry, index) => (
                    <div key={entry.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.performedAt).toLocaleDateString()} at {new Date(entry.performedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            by {entry.performedBy}
                          </p>
                          {entry.amount && (
                            <Badge variant="outline" className="text-xs">
                              ${entry.amount.toLocaleString()}
                            </Badge>
                          )}
                          {entry.status && (
                            <Badge variant={getStatusVariant(entry.status)} className="text-xs">
                              {entry.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No History Available</h3>
                  <p className="text-muted-foreground">
                    Payment history will appear here as actions are performed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders History */}
          {payment.reminders && payment.reminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Reminder History
                </CardTitle>
                <CardDescription>
                  Communication history for this payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment.reminders.map((reminder, index) => (
                    <div key={reminder.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium capitalize">{reminder.reminderType}</p>
                          <p className="text-sm text-muted-foreground">
                            Scheduled: {new Date(reminder.scheduledFor).toLocaleDateString()} at{' '}
                            {new Date(reminder.scheduledFor).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={reminder.status === 'sent' ? 'default' : 'secondary'}>
                        {reminder.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Parent Information */}
        <div className="space-y-6">
          {payment.parent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Parent Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-xl">
                      {payment.parent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{payment.parent.name}</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm break-all">{payment.parent.email}</span>
                  </div>
                  {payment.parent.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{payment.parent.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <Button asChild className="w-full">
                    <Link href={`/parents/${payment.parent.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Parent Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.status === 'pending' && (
                <Button onClick={handleMarkAsPaid} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              {payment.status !== 'paid' && (
                <Button variant="outline" onClick={handleSendReminder} className="w-full" disabled={sendingReminder}>
                  <Bell className="mr-2 h-4 w-4" />
                  {sendingReminder ? 'Sending...' : 'Send Payment Reminder'}
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/communication/send?parentId=${payment.parent?.id}&parentName=${encodeURIComponent(payment.parent?.name || '')}&parentEmail=${encodeURIComponent(payment.parent?.email || '')}&context=payment&paymentId=${payment.id}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Parent
                </Link>
              </Button>
              
              {/* Parent Contracts Section */}
              {payment.parent?.contracts && payment.parent.contracts.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Parent Contracts</h4>
                  <div className="space-y-2">
                    {payment.parent.contracts.slice(0, 3).map((contract) => (
                      <Button asChild key={contract.id} variant="ghost" size="sm" className="w-full justify-start h-auto p-2">
                        <Link href={`/contracts/${contract.id}`}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <div className="text-left">
                                <p className="text-sm font-medium truncate max-w-[140px]">
                                  {contract.originalName || contract.fileName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      contract.status === 'signed' ? 'default' :
                                      contract.status === 'pending' ? 'secondary' :
                                      contract.status === 'expired' ? 'destructive' :
                                      'outline'
                                    } 
                                    className="text-xs"
                                  >
                                    {contract.status}
                                  </Badge>
                                  {contract.templateType && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {contract.templateType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {contract.signedAt ? 
                                  `Signed ${new Date(contract.signedAt).toLocaleDateString()}` :
                                  `Uploaded ${new Date(contract.uploadedAt).toLocaleDateString()}`
                                }
                              </p>
                              {contract.expiresAt && (
                                <p className="text-xs text-muted-foreground">
                                  Expires {new Date(contract.expiresAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </Button>
                    ))}
                    {payment.parent.contracts.length > 3 && (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/parents/${payment.parent.id}#contracts`}>
                          View All {payment.parent.contracts.length} Contracts
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* No Contracts Message */}
              {payment.parent?.contracts && payment.parent.contracts.length === 0 && (
                <div className="pt-3 border-t">
                  <div className="text-center py-3">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No contracts found</p>
                    <Button asChild variant="outline" size="sm" className="mt-2">
                      <Link href={`/contracts/upload?parentId=${payment.parent.id}`}>
                        Upload Contract
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 