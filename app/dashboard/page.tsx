"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, DollarSign, CheckCircle2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { DashboardChart } from "@/components/dashboard-chart"

export default function DashboardPage() {
  const { userGoals: goals } = useApp()

  const totalGoals = goals.length
  const activeGoals = goals.filter((g) => g.status === "active").length
  const completedGoals = goals.filter((g) => g.status === "completed").length
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  const summaryCards = [
    {
      title: "Total de metas",
      value: totalGoals,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Monto acumulado",
      value: `$${totalSaved.toLocaleString()}`,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Metas activas",
      value: activeGoals,
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Metas completadas",
      value: completedGoals,
      icon: CheckCircle2,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          Panel principal
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen general de tus metas financieras
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-border/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Avance general</CardTitle>
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">
            ${totalSaved.toLocaleString()} de ${totalTarget.toLocaleString()} ahorrados
          </p>
        </CardContent>
      </Card>

      <DashboardChart />

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Progreso por meta</CardTitle>
          <Link
            href="/dashboard/goals"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {goals.map((goal) => {
            const percent =
              goal.targetAmount > 0
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                : 0
            return (
              <div key={goal.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {goal.name}
                    </span>
                    {goal.status === "completed" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Completada
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {percent}%
                  </span>
                </div>
                <Progress value={percent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${goal.currentAmount.toLocaleString()}</span>
                  <span>${goal.targetAmount.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
