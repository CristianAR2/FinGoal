"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Goal } from "@/lib/types"

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editGoal?: Goal | null
}

export function GoalFormDialog({ open, onOpenChange, editGoal }: GoalFormDialogProps) {
  const { addGoal, updateGoal } = useApp()
  const [name, setName] = useState(editGoal?.name || "")
  const [targetAmount, setTargetAmount] = useState(editGoal?.targetAmount?.toString() || "")
  const [deadline, setDeadline] = useState(
    editGoal?.deadline ? editGoal.deadline.split("T")[0] : ""
  )
  const [description, setDescription] = useState(editGoal?.description || "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "El nombre es obligatorio"
    if (!targetAmount || parseFloat(targetAmount) <= 0)
      newErrors.targetAmount = "El monto debe ser mayor a 0"
    if (!deadline) newErrors.deadline = "La fecha limite es obligatoria"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (editGoal) {
      updateGoal(editGoal.id, {
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: new Date(deadline).toISOString(),
        description: description || undefined,
      })
    } else {
      addGoal({
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: new Date(deadline).toISOString(),
        description: description || undefined,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editGoal ? "Editar meta" : "Nueva meta"}
          </DialogTitle>
          <DialogDescription>
            {editGoal
              ? "Modifica los datos de tu meta financiera"
              : "Define una nueva meta financiera para empezar a ahorrar"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-name" className="text-foreground">Nombre de la meta</Label>
            <Input
              id="goal-name"
              placeholder="Ej: Fondo de emergencia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-amount" className="text-foreground">Monto objetivo ($)</Label>
            <Input
              id="goal-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="10000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="bg-background"
            />
            {errors.targetAmount && (
              <p className="text-xs text-destructive">{errors.targetAmount}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-deadline" className="text-foreground">Fecha limite</Label>
            <Input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-background"
            />
            {errors.deadline && (
              <p className="text-xs text-destructive">{errors.deadline}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-desc" className="text-foreground">
              Descripcion <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="goal-desc"
              placeholder="Describe tu meta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background resize-none"
              rows={3}
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
            <Button type="submit">
              {editGoal ? "Guardar cambios" : "Crear meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
