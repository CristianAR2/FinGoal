export interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  createdAt: string
}

export interface Goal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  description?: string
  status: "active" | "completed"
  createdAt: string
}

export interface Contribution {
  id: string
  goalId: string
  amount: number
  date: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "deadline" | "completed" | "info"
  message: string
  read: boolean
  createdAt: string
}
