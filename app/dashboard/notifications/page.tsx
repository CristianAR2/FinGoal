"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle2, Clock, Info, CheckCheck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const { userNotifications: notifications, markNotificationRead, markAllNotificationsRead } = useApp()

  const unreadCount = notifications.filter((n) => !n.read).length

  const iconMap = {
    completed: CheckCircle2,
    deadline: Clock,
    info: Info,
  }

  const colorMap = {
    completed: "text-primary bg-primary/10",
    deadline: "text-warning-foreground bg-warning/10",
    info: "text-accent bg-accent/10",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Notificaciones
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificacion${unreadCount > 1 ? "es" : ""} sin leer`
              : "Todas las notificaciones han sido leidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllNotificationsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-foreground">Sin notificaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Las notificaciones apareceran aqui cuando haya actividad
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type]
            const color = colorMap[notification.type]
            return (
              <Card
                key={notification.id}
                className={cn(
                  "border-border/50 transition-all",
                  !notification.read && "border-l-4 border-l-primary bg-primary/[0.02]"
                )}
              >
                <CardContent className="flex items-start gap-4 pt-4 pb-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationRead(notification.id)}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      Marcar leida
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
