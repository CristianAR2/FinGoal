"use client"

import { useApp } from "@/lib/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export function DashboardChart() {
  const { userGoals: goals } = useApp()

  const chartData = goals.map((goal) => ({
    name: goal.name.length > 15 ? goal.name.slice(0, 15) + "..." : goal.name,
    acumulado: goal.currentAmount,
    objetivo: goal.targetAmount,
    porcentaje: goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0,
  }))

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground">Progreso por meta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "acumulado" ? "Acumulado" : "Objetivo",
                ]}
              />
              <Bar dataKey="objetivo" radius={[4, 4, 0, 0]} opacity={0.2}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-obj-${index}`}
                    fill="var(--chart-1)"
                  />
                ))}
              </Bar>
              <Bar dataKey="acumulado" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-acc-${index}`}
                    fill="var(--chart-1)"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
