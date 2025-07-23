'use client'

import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { AIInput } from './ai-input'
import { AITextarea } from './ai-textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import { Save, UserPlus } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface ParentCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onParentCreated?: (parent: any) => void
}

export function ParentCreationModal({ open, onOpenChange, onParentCreated }: ParentCreationModalProps) {
  const { toast } = useToast()
  const createParent = useMutation(api.parents.createParent)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const parentId = await createParent({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        notes: formData.notes || undefined,
        status: 'active'
      })

      toast({
        title: "Parent added successfully",
        description: `${formData.name} has been added to the program.`,
      })

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        notes: ''
      })

      // Call callback with the created parent data
      if (onParentCreated) {
        onParentCreated({ 
          _id: parentId, 
          ...formData,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create parent:', error)
      toast({
        title: "Failed to add parent",
        description: "There was an error adding the parent. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Parent
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <AIInput
                id="name"
                placeholder="Enter parent's full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                fieldType="parent_name"
                context="Full name of parent in the Rise as One basketball program"
                tone="professional"
                onAIGeneration={(text) => handleInputChange('name', text)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <AIInput
                id="email"
                type="email"
                placeholder="parent@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                fieldType="email"
                context="Email address for parent communication"
                tone="professional"
                onAIGeneration={(text) => handleInputChange('email', text)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <AIInput
                id="phone"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                fieldType="phone"
                context="Primary phone number for parent contact"
                tone="professional"
                onAIGeneration={(text) => handleInputChange('phone', text)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <AIInput
                id="emergencyPhone"
                placeholder="(555) 987-6543"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                fieldType="emergency_phone"
                context="Emergency contact phone number"
                tone="professional"
                onAIGeneration={(text) => handleInputChange('emergencyPhone', text)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <AITextarea
              id="address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              fieldType="address"
              context="Complete mailing address for parent"
              tone="professional"
              onAIGeneration={(text) => handleInputChange('address', text)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
            <AIInput
              id="emergencyContact"
              placeholder="Emergency contact person"
              value={formData.emergencyContact}
              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
              fieldType="emergency_contact"
              context="Emergency contact person name and relationship"
              tone="professional"
              onAIGeneration={(text) => handleInputChange('emergencyContact', text)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <AITextarea
              id="notes"
              placeholder="Any additional information about the parent or child..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              fieldType="parent_notes"
              context="Additional notes about parent or child in basketball program"
              tone="professional"
              onAIGeneration={(text) => handleInputChange('notes', text)}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name || !formData.email}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Adding Parent...' : 'Add Parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 