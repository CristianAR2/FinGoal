"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedGoalId?: string
}

export function ContributionDialog({
  open,
  onOpenChange,
  preselectedGoalId,
}: ContributionDialogProps) {
  const { userGoals: goals, addContribution } = useApp()
  const [goalId, setGoalId] = useState(preselectedGoalId || "")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [error, setError] = useState("")

  const activeGoals = goals.filter((g) => g.status === "active")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!goalId) {
      setError("Selecciona una meta")
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("El monto debe ser mayor a 0")
      return
    }

    const result = addContribution(goalId, parseFloat(amount), new Date(date).toISOString())
    if (result.success) {
      onOpenChange(false)
      setAmount("")
    } else {
      setError(result.error || "Error al registrar aporte")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Registrar aporte</DialogTitle>
          <DialogDescription>
            Agrega un nuevo aporte a una de tus metas activas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Meta asociada</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecciona una meta" />
              </SelectTrigger>
              <SelectContent>
                {activeGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contrib-amount" className="text-foreground">Monto ($)</Label>
            <Input
              id="contrib-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contrib-date" className="text-foreground">Fecha</Label>
            <Input
              id="contrib-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Registrar aporte</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
