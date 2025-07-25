import { redirect } from 'next/navigation'
// import { currentUser } from '@clerk/nextjs/server'
// import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Shield, Users, DollarSign, MessageSquare, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LandingPage() {
  // Temporarily disable Clerk authentication
  const user = null // await currentUser()
  
  // Check if user is authenticated and has admin role
  if (user) {
    const userRole = user.publicMetadata?.role || user.privateMetadata?.role
    if (userRole === 'admin') {
      // Redirect to dashboard if user is admin
      redirect('/dashboard')
    } else {
      // Show unauthorized message for non-admin users
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <div className="mb-8">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600">
                  You don't have permission to access this application. Please contact an administrator.
                </p>
              </div>
              <Button onClick={() => window.location.href = '/sign-out'} variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">R1</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Rise as One</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Professional Basketball Program Management System
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Streamline parent communications, payment tracking, and program administration 
              with our comprehensive AI-powered management platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Parent Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive parent profiles, contact management, and program enrollment tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Payment Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated payment tracking, installment plans, and overdue payment management.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Smart Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered messaging, bulk communications, and automated reminder systems.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Contract Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Digital contract storage, e-signatures, and automated compliance tracking.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enterprise-grade security, data encryption, and compliance with privacy regulations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 text-gray-600 mb-2" />
                <CardTitle>Admin Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive administrative dashboard with analytics and system management tools.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Admin Access Section */}
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <Shield className="h-5 w-5 mr-2 text-orange-600" />
                  Admin Access Required
                </CardTitle>
                <CardDescription>
                  This application is restricted to authorized administrators only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <SignInButton mode="modal"> */}
                  <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                    Sign In as Administrator (Clerk Disabled)
                  </Button>
                {/* </SignInButton> */}
                <p className="text-sm text-gray-500">
                  Don't have an account? Contact your system administrator.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
