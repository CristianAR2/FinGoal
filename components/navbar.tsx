"use client"

import { useApp } from "@/lib/app-context"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface NavbarProps {
  title?: string
  onMobileMenuToggle?: () => void
}

export function Navbar({ title = "Dashboard", onMobileMenuToggle }: NavbarProps) {
  // app-context provides the notifications for the authenticated user under "userNotifications"
  const { userNotifications } = useApp()
  const unreadCount = userNotifications.filter((n) => !n.read).length

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Notificaciones</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
