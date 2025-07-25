'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '../../../components/app-layout'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Save,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { Parent } from '../../../lib/types'

export default function NewPaymentPlanPage() {
  const router = useRouter()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    parentId: '',
    type: 'monthly',
    totalAmount: '',
    installmentAmount: '',
    installments: '12',
    startDate: new Date().toISOString().split('T')[0],
    description: ''
  })

  useEffect(() => {
    fetchParents()
  }, [])

  const fetchParents = async () => {
    try {
      const response = await fetch('/api/parents')
      if (response.ok) {
        const data = await response.json()
        const parentsData = Array.isArray(data) ? data : data.parents || []
        setParents(parentsData)
      }
    } catch (error) {
      console.error('Error fetching parents:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.parentId || !formData.totalAmount || !formData.installmentAmount) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          installmentAmount: parseFloat(formData.installmentAmount),
          installments: parseInt(formData.installments)
        })
      })

      if (response.ok) {
        router.push('/payment-plans')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create payment plan')
      }
    } catch (error) {
      console.error('Error creating payment plan:', error)
      alert('Error creating payment plan')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-calculate installment amount for certain types
    if (field === 'totalAmount' || field === 'installments') {
      const total = parseFloat(field === 'totalAmount' ? value : formData.totalAmount)
      const installments = parseInt(field === 'installments' ? value : formData.installments)
      
      if (total && installments && formData.type !== 'full') {
        const installmentAmount = (total / installments).toFixed(2)
        setFormData(prev => ({ ...prev, installmentAmount }))
      }
    }
    
    if (field === 'type') {
      if (value === 'full') {
        setFormData(prev => ({ 
          ...prev, 
          type: value,
          installments: '1',
          installmentAmount: formData.totalAmount 
        }))
      } else if (value === 'monthly') {
        setFormData(prev => ({ ...prev, type: value, installments: '12' }))
      } else if (value === 'seasonal') {
        setFormData(prev => ({ ...prev, type: value, installments: '4' }))
      }
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/payment-plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Payment Plan</h1>
            <p className="text-gray-600">Set up a new payment plan for a parent</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Payment Plan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Selection */}
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent *</Label>
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => handleInputChange('parentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a parent</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Plan Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="monthly">Monthly (12 payments)</option>
                  <option value="seasonal">Seasonal (4 payments)</option>
                  <option value="full">Full Payment (1 payment)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Installments */}
              <div className="space-y-2">
                <Label htmlFor="installments">Number of Installments *</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  value={formData.installments}
                  onChange={(e) => handleInputChange('installments', e.target.value)}
                  disabled={formData.type === 'full'}
                  required
                />
              </div>

              {/* Installment Amount */}
              <div className="space-y-2">
                <Label htmlFor="installmentAmount">Installment Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="installmentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.installmentAmount}
                    onChange={(e) => handleInputChange('installmentAmount', e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                    required
                  />
                </div>
                {formData.type !== 'custom' && (
                  <p className="text-sm text-gray-600">
                    Auto-calculated based on total amount and installments
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Additional notes about this payment plan..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/payment-plans">Cancel</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Plan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.totalAmount && formData.installmentAmount && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Plan Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Amount:</span> ${parseFloat(formData.totalAmount || '0').toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Per Payment:</span> ${parseFloat(formData.installmentAmount || '0').toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Number of Payments:</span> {formData.installments}
                </div>
                <div>
                  <span className="font-medium">Plan Type:</span> {formData.type}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
} 