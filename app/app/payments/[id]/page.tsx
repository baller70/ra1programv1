'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
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
  DollarSign,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Upload,
  Settings,
  RefreshCw,
  Loader2,
  Plus,
  History,
  PlusCircle
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { PaymentProgress } from '../../../components/ui/payment-progress'
import { ModifyScheduleDialog } from '../../../components/ui/modify-schedule-dialog'
import { AiPaymentReminderDialog } from '../../../components/ui/ai-payment-reminder-dialog'
import { ReminderReviewDialog } from '../../../components/ui/reminder-review-dialog'
import { AppLayout } from '../../../components/app-layout'

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
      fileUrl: string // Added for contract details
    }>
    contractStatus?: 'signed' | 'pending' | 'expired'
    contractUrl?: string
    stripeCustomer?: {
      stripeCustomerId: string;
      balance: number;
      delinquent: boolean;
      subscriptions?: Array<{
        id: string;
        status: 'active' | 'trialing' | 'canceled';
        currentPeriodStart: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
        trialEnd: string | null;
        stripeSubscriptionId: string; // Added for cancellation
      }>;
    } | null;
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

interface CommunicationRecord {
  id: string
  subject: string
  body: string
  channel: 'email' | 'sms'
  status: 'sent' | 'delivered' | 'failed'
  sentAt: string
  template?: {
    name: string
    category: string
  }
}

interface PaymentWithParent {
  id: string
  amount: number
  dueDate: string
  status: string
  paidAt: string | null
  parent: {
    id: string
    name: string
    email: string
    phone: string | null
    contractStatus?: string
    contractUrl?: string | null
    contractUploadedAt?: string | null
    contractExpiresAt?: string | null
    contracts?: {
      id: string
      fileName: string
      originalName: string
      fileUrl: string
      status: string
      uploadedAt: string
      signedAt: string | null
      expiresAt: string | null
      templateType: string | null
    }[]
    stripeCustomer?: {
      id: string
      stripeCustomerId: string
      email: string
      name: string
      phone: string | null
      defaultPaymentMethod: string | null
      currency: string | null
      balance: number | null
      delinquent: boolean
      subscriptions?: {
        id: string
        stripeSubscriptionId: string
        status: string
        currentPeriodStart: string
        currentPeriodEnd: string
        cancelAt: string | null
        canceledAt: string | null
        priceId: string
        quantity: number
        trialStart: string | null
        trialEnd: string | null
        metadata: any
      }[]
    }
  } | null
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
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const payment = useQuery(api.payments.getPayment, { 
    id: params.id as Id<"payments"> 
  })
  const paymentHistoryData = useQuery(api.payments.getPaymentHistory, { 
    paymentId: params.id as Id<"payments"> 
  })
  const paymentProgress = useQuery(api.paymentInstallments.getPaymentProgress, {
    parentPaymentId: params.id as Id<"payments">
  })
  const updatePayment = useMutation(api.payments.updatePayment)
  const modifyPaymentSchedule = useMutation(api.paymentInstallments.modifyPaymentSchedule)
  
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [commHistoryLoading, setCommHistoryLoading] = useState(false)
  
  const paymentHistory = paymentHistoryData?.history || []
  const [sendingReminder, setSendingReminder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [selectedPaymentSchedule, setSelectedPaymentSchedule] = useState<string>("")
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [customInstallments, setCustomInstallments] = useState<number>(1)
  const [checkDetails, setCheckDetails] = useState({ checkNumbers: "", startDate: "" })
  const [cashDetails, setCashDetails] = useState({ receiptNumber: "", paidDate: "" })
  const [customAmount, setCustomAmount] = useState<string>("")
  const [customInstallmentCount, setCustomInstallmentCount] = useState<number>(1)
  const [customPaymentFrequency, setCustomPaymentFrequency] = useState<number>(1)

  // Collapsible state
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false)
  const [isCommunicationHistoryOpen, setIsCommunicationHistoryOpen] = useState(true)
  
  // Modify schedule dialog state
  const [modifyScheduleOpen, setModifyScheduleOpen] = useState(false)
  
  // AI reminder dialog state
  const [aiReminderOpen, setAiReminderOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null)

  // Send reminder dialog state
  const [sendReminderOpen, setSendReminderOpen] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')

  // Handle payment success callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const paymentPlan = searchParams.get('plan')
    const subscriptionId = searchParams.get('subscription')
    
    if (paymentStatus === 'success') {
      // Show detailed success message based on payment plan
      let title = 'Payment Successful!'
      let description = 'Your payment has been processed successfully.'
      
      if (paymentPlan === 'full') {
        title = '🎉 Full Payment Complete!'
        description = 'Your full program payment has been processed. You\'re all set!'
      } else if (paymentPlan === 'monthly') {
        title = '📅 Monthly Plan Activated!'
        description = 'Your monthly payment plan is now active. First payment processed successfully.'
      } else if (paymentPlan === 'quarterly') {
        title = '📊 Quarterly Plan Activated!'
        description = 'Your quarterly payment plan is now active. First payment processed successfully.'
      } else if (paymentPlan === 'custom') {
        title = '⚙️ Custom Plan Activated!'
        description = 'Your custom payment plan is now active. First payment processed successfully.'
      }
      
      toast({
        title,
        description,
        duration: 5000, // Show for 5 seconds
      })
      
      // Clean up URL parameters after showing the toast
      setTimeout(() => {
        router.replace(`/payments/${params.id}`, { scroll: false })
      }, 1000)
    }
  }, [searchParams, toast, router, params.id])


  // Payment Methods Configuration
  const paymentMethods = [
    {
      id: "stripe",
      name: "💳 Stripe Online Payment",
      description: "Credit/Debit card payment",
      icon: "CreditCard",
      isOnline: true
    },
    {
      id: "checks",
      name: "📝 Pre-dated Checks",
      description: "Physical check payments",
      icon: "FileText",
      isOnline: false
    },
    {
      id: "cash",
      name: "💵 Cash Payment",
      description: "Cash payment tracking",
      icon: "DollarSign",
      isOnline: false
    }
  ]

  const paymentSchedules = [
    {
      id: "full",
      name: "Full Payment",
      amount: 169959,
      displayAmount: "$1,699.59",
      description: "Complete program payment",
      installments: 1,
      stripeProductId: "prod_Sii6yM3G79NEP0",
      stripePriceId: "price_1RnGg3IzIyImaBG0CdkV5VbB"
    },
    {
      id: "monthly",
      name: "Monthly Plan",
      amount: 18877,
      displayAmount: "$188.77",
      description: "9 monthly payments",
      installments: 9,
      stripeProductId: "prod_Sii6SVyt12xJR9",
      stripePriceId: "price_1RnGgCIzIyImaBG0a8Itn7eI"
    },
    {
      id: "quarterly",
      name: "Quarterly Plan",
      amount: 56674,
      displayAmount: "$566.74",
      description: "3 quarterly payments",
      installments: 3,
      stripeProductId: "prod_Sii6NzRocXynsU",
      stripePriceId: "price_1RnGgCIzIyImaBG0HtVgcpgl"
    },
    {
      id: "custom",
      name: "Custom Schedule",
      amount: null,
      displayAmount: "Custom",
      description: "Custom payment schedule",
      installments: null
    }
  ]

  useEffect(() => {
    if (payment?.parent?._id) {
      fetchCommunicationHistory()
    }
  }, [payment?.parentId])

  const fetchCommunicationHistory = async () => {
    if (!payment?.parentId) return
    
    try {
      setCommHistoryLoading(true)
      const response = await fetch(`/api/communication/history?parentId=${payment.parentId}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        setCommunicationHistory(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching communication history:', error)
    } finally {
      setCommHistoryLoading(false)
    }
  }

  const handleModifySchedule = async (modifiedSchedule: Array<{
    installmentId?: Id<"paymentInstallments">
    amount: number
    dueDate: number
    installmentNumber: number
  }>) => {
    if (!payment) return
    
    try {
      await modifyPaymentSchedule({
        parentPaymentId: payment._id,
        newSchedule: modifiedSchedule
      })
      
      toast({
        title: 'Schedule Updated',
        description: 'Payment schedule has been successfully modified.',
      })
    } catch (error) {
      console.error('Error modifying schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to update payment schedule. Please try again.',
        variant: 'destructive',
      })
      throw error // Re-throw to let the dialog handle it
    }
  }

  const handleAiReminder = (installment: any) => {
    setSelectedInstallment(installment)
    setAiReminderOpen(true)
  }

  const handleSendAiReminder = async (message: string, method: 'email' | 'sms') => {
    if (!payment || !selectedInstallment) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: payment.parentId,
          message: message,
          method: method,
          type: 'payment_reminder',
          installmentId: selectedInstallment._id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }

      const result = await response.json()

      // Enhanced success confirmation
      toast({
        title: '✅ AI Reminder Sent Successfully!',
        description: `Payment reminder sent to ${payment.parent?.name || 'Parent'} via ${method.toUpperCase()} for installment #${selectedInstallment.installmentNumber} ($${payment.amount}).`,
        duration: 5000, // Show for 5 seconds
      })

      // Optional: You could add a visual indicator or update UI state here
      console.log('AI Reminder sent successfully:', {
        parentName: payment.parent?.name,
        method: method,
        amount: payment.amount,
        installment: selectedInstallment.installmentNumber,
        messageId: result.messageId
      })

    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: '❌ Failed to Send AI Reminder',
        description: `Could not send payment reminder to ${payment.parent?.name || 'Parent'}. Please try again or contact support.`,
        variant: 'destructive',
        duration: 7000, // Show error longer
      })
      throw error
    }
  }

  const handleMarkAsPaid = async () => {
    if (!payment) return
    
    try {
      const result = await updatePayment({
        id: payment._id,
        status: 'paid',
        paidAt: Date.now()
      })

      if (result) {
        toast({
          title: 'Payment marked as paid!',
          description: `Payment for ${payment.parent?.name || 'Parent'} has been marked as paid.`,
        })
      } else {
        toast({
          title: 'Error marking as paid',
          description: 'Failed to mark payment as paid.',
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
    if (!payment || !payment.parentId) return
    
    // Get parent name from payment data
    const parentName = payment.parent?.name || 'Parent'
    
    // Generate the reminder message
    const aiGeneratedMessage = `Dear ${parentName},

I hope this message finds you well. I wanted to reach out regarding your payment of $${payment.amount} that was due on ${new Date(payment.dueDate || 0).toLocaleDateString()}.

${payment.status === 'overdue' ? 
  'This payment is currently overdue. ' : 
  'We understand that sometimes payments can be overlooked in our busy schedules. '
}

We're here to help make this process as smooth as possible for you. If you have any questions about this payment or need assistance with payment options, please don't hesitate to reach out to us.

Thank you for your time and continued support of our basketball program.

Best regards,
The Basketball Factory Inc.`

    // Set the message and open the dialog for review
    setReminderMessage(aiGeneratedMessage)
    setSendReminderOpen(true)
  }

  const handleSendReminderConfirm = async (message: string, method: 'email' | 'sms' = 'email') => {
    if (!payment || !payment.parentId) return
    
    try {
      setSendingReminder(true)
      
      // Send the reminder using the messages API endpoint
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: payment.parentId,
          message: message,
          method: method,
          type: 'payment_reminder',
          subject: `Payment Reminder - $${payment.amount} Due`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reminder')
      }

      const result = await response.json()

      // Enhanced success confirmation
      toast({
        title: '✅ Payment Reminder Sent Successfully!',
        description: `Payment reminder sent to ${payment.parent?.name || 'Parent'} via ${method.toUpperCase()} for $${payment.amount} payment.`,
        duration: 5000, // Show for 5 seconds
      })

      // Log successful send for debugging
      console.log('Payment Reminder sent successfully:', {
        parentName: payment.parent?.name,
        method: method,
        amount: payment.amount,
        messageId: result.messageId
      })

      // Close the dialog
      setSendReminderOpen(false)
      setReminderMessage('')
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: '❌ Failed to Send Payment Reminder',
        description: `Could not send payment reminder to ${payment.parent?.name || 'Parent'}. Please try again or contact support.`,
        variant: 'destructive',
        duration: 7000, // Show error longer
      })
    } finally {
      setSendingReminder(false)
    }
  }

  const handleStripePortal = async () => {
    if (!payment?.parent?._id) return;
    setLoadingStripe(true);
    try {
      const response = await fetch(`/api/stripe/portal?parentId=${payment.parent._id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        } else {
          toast({
            title: 'Error opening Stripe Portal',
            description: data.message || 'Failed to open Stripe portal.',
            variant: 'destructive',
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open Stripe portal.');
      }
    } catch (error) {
      console.error('Error handling Stripe portal:', error);
      toast({
        title: 'Failed to open Stripe Portal',
        description: error instanceof Error ? error.message : 'There was an error opening the Stripe portal.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleStripeSync = async () => {
    if (!payment?.parent?._id) return;
    setLoadingStripe(true);
    try {
      const response = await fetch(`/api/stripe/sync?parentId=${payment.parent._id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Stripe Sync Successful',
            description: 'Stripe customer data synced successfully.',
          });
          // Refresh payment details would go here if we had that function
        } else {
          toast({
            title: 'Stripe Sync Failed',
            description: data.message || 'Failed to sync Stripe customer data.',
            variant: 'destructive',
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync Stripe customer data.');
      }
    } catch (error) {
      console.error('Error handling Stripe sync:', error);
      toast({
        title: 'Failed to Sync Stripe',
        description: error instanceof Error ? error.message : 'There was an error syncing the Stripe customer data.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleStripeSetup = async () => {
    if (!payment?.parentId) return;
    
    // Check if a payment option is selected
    if (!selectedPaymentOption) {
      toast({
        title: 'Payment Plan Required',
        description: 'Please select a payment plan first.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingStripe(true);
    try {
      // Get parent data
      const parentName = (payment as any).parentName || payment.parent?.name || 'Parent'
      const parentEmail = (payment as any).parentEmail || payment.parent?.email || ''
      
      if (!parentEmail) {
        toast({
          title: 'Email Required',
          description: 'Parent email is required to process payment.',
          variant: 'destructive',
        });
        return;
      }

      // Get the selected payment option details
      const selectedOption = paymentSchedules.find(option => option.id === selectedPaymentOption);
      if (!selectedOption) {
        toast({
          title: 'Invalid Payment Option',
          description: 'Please select a valid payment option.',
          variant: 'destructive',
        });
        return;
      }

      // Validate custom payment fields if custom option is selected
      if (selectedOption.id === 'custom') {
        if (!customAmount || parseFloat(customAmount) <= 0) {
          toast({
            title: 'Invalid Amount',
            description: 'Please enter a valid payment amount.',
            variant: 'destructive',
          });
          return;
        }
        if (!customInstallmentCount || customInstallmentCount < 1) {
          toast({
            title: 'Invalid Installments',
            description: 'Please enter a valid number of installments.',
            variant: 'destructive',
          });
          return;
        }
        if (!customPaymentFrequency || customPaymentFrequency < 1) {
          toast({
            title: 'Invalid Frequency',
            description: 'Please enter a valid payment frequency.',
            variant: 'destructive',
          });
          return;
        }
      }

      // For custom option, use the payment amount; for others, use the option amount
      const paymentAmount = selectedOption.id === 'custom' ? 
        (parseFloat(customAmount) * 100) || payment.amount : 
        selectedOption.amount;
      const displayAmount = selectedOption.id === 'custom' ? 
        `$${parseFloat(customAmount || '0').toFixed(2)}` : 
        selectedOption.displayAmount;

      // Redirect to checkout page
      const checkoutParams: Record<string, string> = {
        amount: selectedOption.id === 'custom' ? 
          (parseFloat(customAmount) || 0).toFixed(2) : 
          displayAmount.replace('$', ''),
        name: parentName,
        email: parentEmail,
        parentId: payment.parentId,
        plan: selectedOption.id,
        installments: selectedOption.id === 'custom' ? 
          customInstallmentCount.toString() : 
          (selectedOption.installments?.toString() || '1')
      };

      // Add custom payment frequency for custom plans
      if (selectedOption.id === 'custom') {
        checkoutParams.frequency = customPaymentFrequency.toString();
        checkoutParams.totalAmount = (parseFloat(customAmount || '0') * customInstallmentCount).toFixed(2);
      }

      const checkoutUrl = `/payments/${payment._id}/checkout?` + new URLSearchParams(checkoutParams).toString();

      // Navigate to checkout page
      router.push(checkoutUrl);
      
      const toastDescription = selectedOption.id === 'custom' 
        ? `Processing custom payment: ${displayAmount} every ${customPaymentFrequency} month${customPaymentFrequency !== 1 ? 's' : ''} for ${customInstallmentCount} payment${customInstallmentCount !== 1 ? 's' : ''}`
        : `Processing ${selectedOption.name} - ${displayAmount}`;
      
      toast({
        title: 'Redirecting to Payment',
        description: toastDescription,
      });

    } catch (error) {
      console.error('Error setting up payment:', error);
      toast({
        title: 'Failed to Setup Payment',
        description: error instanceof Error ? error.message : 'There was an error setting up the payment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingStripe(false);
    }
  };
  // Handle Payment Option Processing
  const handlePaymentProcess = async () => {
    if (!selectedPaymentOption || !payment?.parent?.id) {
      toast({
        title: "Error",
        description: "Please select a payment option",
        variant: "destructive"
      })
      return
    }

    const option = paymentSchedules.find(opt => opt.id === selectedPaymentOption)
    if (!option) return

    setProcessingPayment(true)
    try {
      // Create Stripe checkout session or payment link
      const response = await fetch(`/api/stripe/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: payment.parent.id,
          paymentId: payment.id,
          priceId: option.stripePriceId,
          paymentType: option.type,
          mode: option.type === "one_time" ? "payment" : "subscription"
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        // Open payment URL in new tab for both admin and user
        window.open(url, "_blank")
        toast({
          title: "Payment Initiated",
          description: `${option.name} payment process started`,
        })
      } else {
        throw new Error("Failed to create payment")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive"
      })
    } finally {
      setProcessingPayment(false)
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !payment) {
    return (
      <AppLayout>
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
      </AppLayout>
    )
  }

  const daysOverdue = payment.status === 'overdue'
    ? Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <AppLayout>
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
          <Button asChild variant="outline">
            <Link href="/communication">
              <MessageCircle className="mr-2 h-4 w-4" />
              Communication
            </Link>
          </Button>
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
          {payment.status !== 'paid' && (
            <Button variant="outline" onClick={handleStripeSetup} disabled={loadingStripe}>
              <CreditCard className="mr-2 h-4 w-4" />
              {loadingStripe ? 'Opening Payment Form...' : 'Pay with Credit Card'}
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
              {/* Show subscription/plan information if available */}
              {payment.paymentPlan ? (
                <>
                  {/* Payment Plan Summary */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Payment Plan:</span>
                      <Badge variant="outline" className="capitalize">
                        {payment.paymentPlan.type} Plan
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Plan Amount: ${Number(payment.paymentPlan.installmentAmount).toLocaleString()}</div>
                      <div>Total Program Cost: ${Number(payment.paymentPlan.totalAmount).toLocaleString()}</div>
                      {payment.paymentPlan.description && (
                        <div className="font-medium text-blue-700 mt-2">
                          {payment.paymentPlan.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Status Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-3xl font-bold text-green-600">
                        ${Number(payment.paymentPlan?.installmentAmount || payment.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        {payment.status === 'paid' ? 'Payment Made' : 'Current Payment'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-lg font-bold text-blue-600">
                        {payment.status === 'paid' && payment.paidAt 
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : new Date(payment.dueDate).toLocaleDateString()
                        }
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        {payment.status === 'paid' ? 'Payment Date' : 'Due Date'}
                      </p>
                    </div>
                    <div className={`text-center p-4 rounded-lg border ${
                      payment.status === 'paid' 
                        ? 'bg-green-50 border-green-200' 
                        : payment.status === 'overdue'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      {payment.status === 'paid' ? (
                        <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      ) : payment.status === 'overdue' ? (
                        <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                      ) : (
                        <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                      )}
                      <p className={`text-lg font-bold capitalize ${
                        payment.status === 'paid' 
                          ? 'text-green-600' 
                          : payment.status === 'overdue'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {payment.status === 'paid' ? 'Active' : payment.status}
                      </p>
                      <p className={`text-sm font-medium ${
                        payment.status === 'paid' 
                          ? 'text-green-600' 
                          : payment.status === 'overdue'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {payment.status === 'paid' ? 'Payment Status' : 'Payment Status'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Standard payment display for non-subscription payments */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-3xl font-bold text-green-600">
                      ${Number(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 font-medium">Amount Due</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">Due Date</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${
                    payment.status === 'paid' 
                      ? 'bg-green-50 border-green-200' 
                      : payment.status === 'overdue'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    {payment.status === 'paid' ? (
                      <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    ) : payment.status === 'overdue' ? (
                      <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    ) : (
                      <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    )}
                    <p className={`text-lg font-bold capitalize ${
                      payment.status === 'paid' 
                        ? 'text-green-600' 
                        : payment.status === 'overdue'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {payment.status}
                    </p>
                    <p className={`text-sm font-medium ${
                      payment.status === 'paid' 
                        ? 'text-green-600' 
                        : payment.status === 'overdue'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      Payment Status
                    </p>
                  </div>
                </div>
              )}
              
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

              {/* Subscription Notes */}
              {payment.paymentPlan && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-800">Subscription Notes</span>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {payment.paymentPlan.type === 'monthly' && 'Subscription created: monthly plan'}
                    {payment.paymentPlan.type === 'quarterly' && 'Subscription created: quarterly plan'}
                    {payment.paymentPlan.type === 'custom' && 'Subscription created: custom plan'}
                    {payment.paymentPlan.type === 'full' && 'One-time payment plan'}
                  </p>
                  {payment.notes && (
                    <p className="text-gray-600 text-sm mt-2 italic">
                      Additional notes: {payment.notes}
                    </p>
                  )}
                </div>
              )}
              
              {payment.notes && !payment.paymentPlan && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Payment Notes</label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Progress - Show if installments exist */}
          {paymentProgress && paymentProgress.installments && paymentProgress.installments.length > 0 && (
            <PaymentProgress 
              progressData={paymentProgress}
              onPayInstallment={(installmentId) => {
                // Handle individual installment payment
                router.push(`/payments/${params.id}/checkout?installment=${installmentId}`)
              }}
              onModifySchedule={() => {
                setModifyScheduleOpen(true)
              }}
              onAiReminder={handleAiReminder}
              isAdmin={true} // TODO: Check actual admin status
            />
          )}

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
          <Collapsible open={isPaymentHistoryOpen} onOpenChange={setIsPaymentHistoryOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Payment History
                    </div>
                    {isPaymentHistoryOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Track of all payment-related activities and status changes
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Card>
          </Collapsible>

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

          {/* Communication History */}
          <Collapsible open={isCommunicationHistoryOpen} onOpenChange={setIsCommunicationHistoryOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Communication History
                    </div>
                    {isCommunicationHistoryOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Recent messages and communications with {payment.parent?.name}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                {commHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading communications...</span>
                  </div>
                ) : communicationHistory.length > 0 ? (
                  <div className="space-y-4">
                    {communicationHistory.slice(0, 5).map((comm, index) => (
                      <div key={comm.id} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {comm.channel === 'email' ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-green-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {comm.channel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={comm.status === 'delivered' ? 'default' : comm.status === 'sent' ? 'secondary' : 'destructive'} className="text-xs">
                              {comm.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comm.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-medium text-sm mb-2">
                          {comm.subject || 'No Subject'}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {comm.body}
                        </p>
                      </div>
                    ))}
                    
                    {communicationHistory.length > 5 && (
                      <div className="pt-4 border-t">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/communication/history?parentId=${payment.parent?.id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            View More ({communicationHistory.length - 5} more messages)
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No Communications Yet</h4>
                    <p className="text-muted-foreground mb-4">
                      No messages have been sent to {payment.parent?.name} yet.
                    </p>
                    <Button asChild>
                      <Link href="/communication/send">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send First Message
                      </Link>
                    </Button>
                  </div>
                )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
        </div>

        {/* Sidebar - Parent Information and Quick Actions */}
        <div className="space-y-6">
          {/* Parent Information - ALWAYS FIRST */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Parent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payment.parent ? (
                <>
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
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/parents/${payment.parent._id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Parent Profile
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Parent Information</h4>
                  <p className="text-muted-foreground">
                    Parent information is not available for this payment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card - ALWAYS SECOND */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                  {/* Stripe Integration Section */}
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Stripe Integration
                      </h4>
                      {payment.parent?.stripeCustomer ? (
                        <Badge variant="default">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                    </div>
                    
                    {payment.parent?.stripeCustomer ? (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Customer ID: {payment.parent.stripeCustomer.stripeCustomerId}</p>
                          <p>Balance: ${(payment.parent.stripeCustomer.balance / 100).toFixed(2)}</p>
                          {payment.parent.stripeCustomer.delinquent && (
                            <p className="text-red-600">⚠ Account Delinquent</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={handleStripePortal}
                            disabled={loadingStripe}
                          >
                            <Settings className="mr-2 h-3 w-3" />
                            {loadingStripe ? 'Loading...' : 'Manage'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={handleStripeSync}
                            disabled={loadingStripe}
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Sync
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Click to open secure payment form
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={handleStripeSetup}
                          disabled={loadingStripe || !selectedPaymentOption}
                        >
                          <CreditCard className="mr-2 h-3 w-3" />
                          {loadingStripe ? 'Creating Payment Link...' : 
                           selectedPaymentOption ? 
                           `Pay ${paymentSchedules.find(opt => opt.id === selectedPaymentOption)?.displayAmount || 'with Credit Card'}` :
                           'Select Payment Plan First'}
                        </Button>
                      </div>
                    )}
                  </div>


                  {/* Payment Options Section */}
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Options
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {payment.parent?.stripeCustomer ? "Ready" : "Setup Needed"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Select Payment Plan
                        </label>
                        <Select
                          value={selectedPaymentOption}
                          onValueChange={setSelectedPaymentOption}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose payment option..." />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentSchedules.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{option.name}</span>
                                    <span className="text-green-600 font-bold ml-2">{option.displayAmount}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground text-left">
                                    {option.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Custom Payment Fields */}
                      {selectedPaymentOption === 'custom' && (
                        <div className="space-y-3 p-3 border rounded-lg bg-background">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Custom Amount ($)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Enter amount per payment"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Number of Installments
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="24"
                              placeholder="Total number of payments"
                              value={customInstallmentCount}
                              onChange={(e) => setCustomInstallmentCount(parseInt(e.target.value) || 1)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Payment Frequency (months)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="12"
                              placeholder="Months between payments"
                              value={customPaymentFrequency}
                              onChange={(e) => setCustomPaymentFrequency(parseInt(e.target.value) || 1)}
                              className="text-sm"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                            <strong>Preview:</strong> ${customAmount || '0'} every {customPaymentFrequency} month{customPaymentFrequency !== 1 ? 's' : ''} for {customInstallmentCount} payment{customInstallmentCount !== 1 ? 's' : ''} 
                            {customAmount && customInstallmentCount && (
                              <span className="block mt-1">
                                <strong>Total:</strong> ${(parseFloat(customAmount || '0') * customInstallmentCount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        onClick={handlePaymentProcess}
                        disabled={!selectedPaymentOption || processingPayment || !payment.parent?.stripeCustomer}
                        className="w-full"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {processingPayment ? "Processing..." : "Process Payment"}
                      </Button>
                      
                      {!payment.parent?.stripeCustomer && (
                        <p className="text-xs text-muted-foreground text-center">
                          Complete Stripe setup first to process payments
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Contract Section */}
              <div className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contract
                  </h4>
                  {payment.parent?.contracts && payment.parent.contracts.length > 0 ? (
                    <Badge variant={
                      payment.parent.contracts[0].status === 'signed' ? 'default' :
                      payment.parent.contracts[0].status === 'pending' ? 'secondary' :
                      payment.parent.contracts[0].status === 'expired' ? 'destructive' :
                      'outline'
                    }>
                      {payment.parent.contracts[0].status}
                    </Badge>
                  ) : payment.parent?.contractStatus ? (
                    <Badge variant={
                      payment.parent.contractStatus === 'signed' ? 'default' :
                      payment.parent.contractStatus === 'pending' ? 'secondary' :
                      payment.parent.contractStatus === 'expired' ? 'destructive' :
                      'outline'
                    }>
                      {payment.parent.contractStatus}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Uploaded</Badge>
                  )}
                </div>
                
                {payment.parent?.contracts && payment.parent.contracts.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {payment.parent.contracts[0].originalName}
                    </p>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/contracts/${payment.parent.contracts[0].id}`}>
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <a href={payment.parent.contracts[0].fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : payment.parent?.contractStatus && payment.parent?.contractUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Legacy Contract ({payment.parent.contractStatus})
                    </p>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href="/contracts">
                          <Eye className="mr-2 h-3 w-3" />
                          View All
                        </Link>
                      </Button>
                      {payment.parent.contractUrl && (
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <a href={payment.parent.contractUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Open
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No contract uploaded yet
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/contracts/upload?parentId=${payment.parent?.id}`}>
                        <Upload className="mr-2 h-3 w-3" />
                        Upload Contract
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/communication">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Communication
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleSendReminder} 
                disabled={sendingReminder || payment.status === 'paid'}
              >
                <Bell className="mr-2 h-4 w-4" />
                {sendingReminder ? 'Sending...' : 'Send Reminder'}
              </Button>

              {payment.status === 'pending' && (
                <Button onClick={handleMarkAsPaid} size="sm" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </div>
              {paymentHistoryData?.summary && (
                <Badge variant="outline">
                  {paymentHistoryData.summary.totalEvents} Event{paymentHistoryData.summary.totalEvents !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            {paymentHistoryData?.summary && (
              <div className="text-sm text-muted-foreground">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <span className="font-medium">Total Amount:</span> ${paymentHistoryData.summary.totalAmount}
                  </div>
                  <div>
                    <span className="font-medium">Amount Paid:</span> ${paymentHistoryData.summary.amountPaid}
                  </div>
                  <div>
                    <span className="font-medium">Installments:</span> {paymentHistoryData.summary.installmentsPaid}/{paymentHistoryData.summary.totalInstallments}
                  </div>
                  <div>
                    <span className="font-medium">Parent:</span> {paymentHistoryData.summary.parentName || 'Unknown'}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((event: any) => (
                  <div key={event.id} className="flex gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex-shrink-0">
                      {event.icon === 'plus-circle' && <PlusCircle className="h-5 w-5 text-blue-500" />}
                      {event.icon === 'calendar' && <Calendar className="h-5 w-5 text-purple-500" />}
                      {event.icon === 'file-text' && <FileText className="h-5 w-5 text-gray-500" />}
                      {event.icon === 'check-circle' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {event.icon === 'alert-triangle' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                          <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      
                      {/* Event Details */}
                      {event.details && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {event.details.amount && (
                              <div>
                                <span className="font-medium">Amount:</span> ${event.details.amount}
                              </div>
                            )}
                            {event.details.installmentNumber && (
                              <div>
                                <span className="font-medium">Installment:</span> #{event.details.installmentNumber}
                              </div>
                            )}
                            {event.details.dueDate && (
                              <div>
                                <span className="font-medium">Due Date:</span> {new Date(event.details.dueDate || Date.now()).toLocaleDateString()}
                              </div>
                            )}
                            {event.details.paidAt && (
                              <div>
                                <span className="font-medium">Paid At:</span> {new Date(event.details.paidAt || Date.now()).toLocaleDateString()}
                              </div>
                            )}
                            {event.details.paymentMethod && (
                              <div>
                                <span className="font-medium">Method:</span> {event.details.paymentMethod}
                              </div>
                            )}
                            {event.details.transactionId && (
                              <div>
                                <span className="font-medium">Transaction ID:</span> {event.details.transactionId}
                              </div>
                            )}
                            {event.details.daysPastDue && (
                              <div>
                                <span className="font-medium">Days Past Due:</span> {event.details.daysPastDue}
                              </div>
                            )}
                            {event.details.status && (
                              <div>
                                <span className="font-medium">Status:</span> 
                                <Badge 
                                  variant={
                                    event.details.status === 'paid' ? 'default' :
                                    event.details.status === 'pending' ? 'secondary' :
                                    event.details.status === 'overdue' ? 'destructive' :
                                    'outline'
                                  }
                                  className="ml-2"
                                >
                                  {event.details.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Payment Plan Details */}
                          {event.details.paymentPlan && (
                            <div className="border-t pt-2 mt-2">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Payment Plan Details:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium">Type:</span> {event.details.paymentPlan.type}
                                </div>
                                <div>
                                  <span className="font-medium">Total Amount:</span> ${event.details.paymentPlan.totalAmount}
                                </div>
                                <div>
                                  <span className="font-medium">Installment Amount:</span> ${event.details.paymentPlan.installmentAmount}
                                </div>
                                <div>
                                  <span className="font-medium">Installments:</span> {event.details.paymentPlan.installments}
                                </div>
                              </div>
                              {event.details.paymentPlan.description && (
                                <div className="text-xs mt-2">
                                  <span className="font-medium">Description:</span> {event.details.paymentPlan.description}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">
                          Performed by: {event.performedBy}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Payment History</h3>
                <p className="text-sm text-muted-foreground">
                  Payment history will appear here as events occur.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    {/* Modify Schedule Dialog */}
    {paymentProgress && paymentProgress.installments && (
      <ModifyScheduleDialog
        open={modifyScheduleOpen}
        onOpenChange={setModifyScheduleOpen}
        installments={paymentProgress.installments}
        onSave={handleModifySchedule}
        paymentId={params.id as string}
      />
    )}

    {/* AI Payment Reminder Dialog */}
    {selectedInstallment && payment && (
      <AiPaymentReminderDialog
        open={aiReminderOpen}
        onOpenChange={setAiReminderOpen}
        paymentData={{
          parentName: payment.parent?.name || 'Parent',
          parentEmail: payment.parent?.email || '',
          amount: selectedInstallment.amount,
          dueDate: selectedInstallment.dueDate,
          installmentNumber: selectedInstallment.installmentNumber,
          totalInstallments: paymentProgress?.totalInstallments,
          paymentPlan: payment.paymentPlan?.type || 'standard',
          status: selectedInstallment.status,
          daysPastDue: selectedInstallment.status === 'overdue' ? 
            Math.floor((Date.now() - selectedInstallment.dueDate) / (1000 * 60 * 60 * 24)) : 0
        }}
        onSendReminder={handleSendAiReminder}
      />
    )}

    {/* Send Reminder Review Dialog */}
    {payment && (
      <ReminderReviewDialog
        open={sendReminderOpen}
        onOpenChange={setSendReminderOpen}
        paymentData={{
          parentName: payment.parent?.name || 'Parent',
          parentEmail: payment.parent?.email || '',
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: payment.status,
        }}
        initialMessage={reminderMessage}
        onSendReminder={handleSendReminderConfirm}
        isSending={sendingReminder}
      />
    )}
  </AppLayout>
  )
}
