
'use client'

import { ThemeProvider } from "next-themes";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { convex } from "@/lib/convex";
import { Toaster } from "./ui/toaster";
import { Toaster as SonnerToaster } from "./ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Temporarily disable Clerk due to invalid API keys
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </ThemeProvider>
    </ConvexProvider>
  );
}
