
'use client'

import { Header } from './header'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Temporarily disabled for development - uncomment when Clerk is properly configured
  // const { isLoaded, isSignedIn } = useUser()

  // if (!isLoaded) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
  //     </div>
  //   )
  // }

  // if (!isSignedIn) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
  //         <p className="text-muted-foreground">You need to be signed in to access this page.</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  )
}
