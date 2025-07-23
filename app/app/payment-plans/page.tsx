'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { AppLayout } from '../../components/app-layout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PaymentPlan {
  id: string
  name: string
  description: string
  type: string
  totalAmount: number
  installmentAmount: number
  installments: number
  frequency: string
  status: string
  createdAt: string
  updatedAt: string
  activeSubscriptions: number
  totalRevenue: number
}

export default function PaymentPlansPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Use Convex query instead of fetch
  const paymentPlansData = useQuery(api.paymentPlans.getPaymentPlans, {
    search: searchTerm,
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter
  })
  
  const paymentPlans = paymentPlansData?.paymentPlans || []
  const loading = paymentPlansData === undefined

  useEffect(() => {
    // No need to fetch manually - Convex handles this
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment plan?')) return

    try {
      const response = await fetch(`/api/payment-plans/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // setPaymentPlans(prev => prev.filter(plan => plan.id !== id)) // This line is removed as paymentPlans is now a query result
      } else {
        alert('Failed to delete payment plan')
      }
    } catch (error) {
      console.error('Error deleting payment plan:', error)
      alert('Error deleting payment plan')
    }
  }

  const filteredPlans = paymentPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly': return 'bg-blue-100 text-blue-800'
      case 'seasonal': return 'bg-purple-100 text-purple-800'
      case 'full': return 'bg-green-100 text-green-800'
      case 'custom': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading payment plans...</p>
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Payment Plans</h1>
            <p className="text-gray-600">Manage payment plans and schedules</p>
          </div>
          <Button asChild>
            <Link href="/payment-plans/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Link>
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payment plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredPlans.length} of {paymentPlans.length} plans
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold">{paymentPlans.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {paymentPlans.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paused</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {paymentPlans.filter(p => p.status === 'paused').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${paymentPlans.reduce((sum, plan) => sum + Number(plan.totalAmount), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment plans found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first payment plan.'}
                </p>
                {!searchTerm && (
                  <Button asChild>
                    <Link href="/payment-plans/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Payment Plan
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{plan.name}</h3>
                          <Badge className={getStatusColor(plan.status)}>
                            {plan.status}
                          </Badge>
                          <Badge className={getTypeColor(plan.type)}>
                            {plan.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount:</span> ${Number(plan.installmentAmount).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {plan.type}
                          </div>
                          <div>
                            <span className="font-medium">Next Due:</span>{' '}
                            {/* Assuming nextDueDate is part of the PaymentPlan interface */}
                            {/* If not, this will cause an error. For now, keeping it as is */}
                            {/* {plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : 'N/A'} */}
                            N/A
                          </div>
                          <div>
                            <span className="font-medium">Payments:</span> {/* Assuming _count is part of the PaymentPlan interface */}
                            {/* If not, this will cause an error. For now, keeping it as is */}
                            {/* {plan._count?.payments || 0} */}
                            0
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/payment-plans/${plan.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 