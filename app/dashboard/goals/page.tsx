"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoalCard } from "@/components/goal-card"
import { GoalFormDialog } from "@/components/goal-form-dialog"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ContributionDialog } from "@/components/contribution-dialog"
import { Plus, Search } from "lucide-react"
import type { Goal } from "@/lib/types"

export default function GoalsPage() {
  const { userGoals: goals } = useApp()
  const { deleteGoal } = useApp()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)

  const filteredGoals = goals
    .filter((g) => {
      if (filter === "active") return g.status === "active"
      if (filter === "completed") return g.status === "completed"
      return true
    })
    .filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    )

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setShowGoalForm(true)
  }

  const handleDelete = (goal: Goal) => {
    setDeleteTarget(goal)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteGoal(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleContribute = (goalId: string) => {
    setContributeGoalId(goalId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Mis metas
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Administra tus metas financieras
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null)
            setShowGoalForm(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva meta
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar meta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-lg font-medium text-foreground">No se encontraron metas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter !== "all"
              ? "Prueba cambiando el filtro"
              : "Crea tu primera meta para empezar a ahorrar"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onContribute={handleContribute}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        key={editingGoal?.id || "new"}
        open={showGoalForm}
        onOpenChange={setShowGoalForm}
        editGoal={editingGoal}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        goalName={deleteTarget?.name || ""}
        onConfirm={confirmDelete}
      />

      <ContributionDialog
        key={contributeGoalId || "none"}
        open={!!contributeGoalId}
        onOpenChange={(open) => !open && setContributeGoalId(null)}
        preselectedGoalId={contributeGoalId || undefined}
      />
    </div>
  )
}
