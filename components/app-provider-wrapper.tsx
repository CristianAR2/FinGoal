"use client"

import { AppProvider } from "@/lib/app-context"

export function AppProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}
