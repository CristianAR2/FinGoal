import type { User, Goal, Contribution, Notification } from "./types"

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Carlos Mendoza",
    email: "carlos@fingoal.com",
    role: "user",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "admin-1",
    name: "Admin FinGoal",
    email: "admin@fingoal.com",
    role: "admin",
    createdAt: "2024-12-01T10:00:00Z",
  },
]

export const mockGoals: Goal[] = [
  {
    id: "goal-1",
    userId: "user-1",
    name: "Fondo de emergencia",
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: "2026-06-30T00:00:00Z",
    description: "Ahorrar 6 meses de gastos para emergencias",
    status: "active",
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "goal-2",
    userId: "user-1",
    name: "Vacaciones Europa",
    targetAmount: 5000,
    currentAmount: 5000,
    deadline: "2026-03-15T00:00:00Z",
    description: "Viaje de 2 semanas por Europa",
    status: "completed",
    createdAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "goal-3",
    userId: "user-1",
    name: "Auto nuevo",
    targetAmount: 25000,
    currentAmount: 8750,
    deadline: "2027-01-01T00:00:00Z",
    description: "Enganche para auto nuevo",
    status: "active",
    createdAt: "2025-03-10T10:00:00Z",
  },
  {
    id: "goal-4",
    userId: "user-1",
    name: "Curso de inversiones",
    targetAmount: 1500,
    currentAmount: 1200,
    deadline: "2026-03-01T00:00:00Z",
    description: "Certificacion en mercados financieros",
    status: "active",
    createdAt: "2025-04-05T10:00:00Z",
  },
  {
    id: "goal-5",
    userId: "user-1",
    name: "Laptop nueva",
    targetAmount: 2000,
    currentAmount: 500,
    deadline: "2026-04-15T00:00:00Z",
    description: "MacBook Pro para trabajo remoto",
    status: "active",
    createdAt: "2025-05-01T10:00:00Z",
  },
]

export const mockContributions: Contribution[] = [
  { id: "c-1", goalId: "goal-1", amount: 2000, date: "2025-02-15T00:00:00Z", createdAt: "2025-02-15T10:00:00Z" },
  { id: "c-2", goalId: "goal-1", amount: 1500, date: "2025-03-15T00:00:00Z", createdAt: "2025-03-15T10:00:00Z" },
  { id: "c-3", goalId: "goal-1", amount: 1500, date: "2025-04-15T00:00:00Z", createdAt: "2025-04-15T10:00:00Z" },
  { id: "c-4", goalId: "goal-1", amount: 1500, date: "2025-05-15T00:00:00Z", createdAt: "2025-05-15T10:00:00Z" },
  { id: "c-5", goalId: "goal-2", amount: 2500, date: "2025-02-10T00:00:00Z", createdAt: "2025-02-10T10:00:00Z" },
  { id: "c-6", goalId: "goal-2", amount: 2500, date: "2025-03-10T00:00:00Z", createdAt: "2025-03-10T10:00:00Z" },
  { id: "c-7", goalId: "goal-3", amount: 3000, date: "2025-04-01T00:00:00Z", createdAt: "2025-04-01T10:00:00Z" },
  { id: "c-8", goalId: "goal-3", amount: 2750, date: "2025-05-01T00:00:00Z", createdAt: "2025-05-01T10:00:00Z" },
  { id: "c-9", goalId: "goal-3", amount: 3000, date: "2025-06-01T00:00:00Z", createdAt: "2025-06-01T10:00:00Z" },
  { id: "c-10", goalId: "goal-4", amount: 600, date: "2025-04-15T00:00:00Z", createdAt: "2025-04-15T10:00:00Z" },
  { id: "c-11", goalId: "goal-4", amount: 600, date: "2025-05-15T00:00:00Z", createdAt: "2025-05-15T10:00:00Z" },
  { id: "c-12", goalId: "goal-5", amount: 500, date: "2025-05-10T00:00:00Z", createdAt: "2025-05-10T10:00:00Z" },
]

export const mockNotifications: Notification[] = [
  {
    id: "n-1",
    userId: "user-1",
    type: "completed",
    message: "Tu meta 'Vacaciones Europa' ha sido completada. Felicidades!",
    read: false,
    createdAt: "2025-03-10T10:00:00Z",
  },
  {
    id: "n-2",
    userId: "user-1",
    type: "deadline",
    message: "Tu meta 'Curso de inversiones' vence en menos de 48 horas.",
    read: false,
    createdAt: "2026-02-27T08:00:00Z",
  },
  {
    id: "n-3",
    userId: "user-1",
    type: "info",
    message: "Nuevo aporte registrado en 'Fondo de emergencia': $1,500",
    read: true,
    createdAt: "2025-05-15T10:00:00Z",
  },
]
