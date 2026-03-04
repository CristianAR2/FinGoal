"use client"

import type { Goal } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus, Calendar, CheckCircle2 } from "lucide-react"
import { format, differenceInHours } from "date-fns"

interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onDelete: (goal: Goal) => void
  onContribute: (goalId: string) => void
}

export function GoalCard({ goal, onEdit, onDelete, onContribute }: GoalCardProps) {
  const percent =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0
  const remaining = goal.targetAmount - goal.currentAmount
  const hoursToDeadline = differenceInHours(new Date(goal.deadline), new Date())
  const isUrgent = hoursToDeadline <= 48 && hoursToDeadline > 0 && goal.status === "active"

  return (
    <Card className="border-border/50 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground truncate">
                {goal.name}
              </h3>
              {goal.status === "completed" && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  Completada
                </span>
              )}
              {isUrgent && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning-foreground">
                  Vence pronto
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(goal)}
              aria-label="Editar meta"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(goal)}
              aria-label="Eliminar meta"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-semibold text-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${goal.currentAmount.toLocaleString()} acumulado</span>
            <span>${remaining.toLocaleString()} restante</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Vence: {format(new Date(goal.deadline), "dd/MM/yyyy")}</span>
          </div>
          {goal.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContribute(goal.id)}
              className="text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Aporte
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
