
'use client'

import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/toaster'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
