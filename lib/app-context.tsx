"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import type { User, Goal, Contribution, Notification } from "@/lib/types"
import {
  mockUsers,
  mockGoals,
  mockContributions,
  mockNotifications,
} from "@/lib/mock-data"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

interface PasswordRecoveryToken {
  email: string
  token: string
  newPassword: string
  expiresAt: number
}

interface AppContextType {
  auth: AuthState
  authReady: boolean
  userGoals: Goal[]
  userContributions: Contribution[]
  userNotifications: Notification[]
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  recoverPassword: (email: string) => { success: boolean; error?: string }
  resetPassword: (email: string, newPassword: string, token: string) => { success: boolean; error?: string }
  addGoal: (goal: Omit<Goal, "id" | "userId" | "currentAmount" | "status" | "createdAt">) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addContribution: (goalId: string, amount: number, date: string) => { success: boolean; error?: string }
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const STORAGE_PREFIX = "fingoal"

function saveToSession<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${key}`, JSON.stringify(data))
  } catch {
    // localStorage not available
  }
}

function loadFromSession<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}-${key}`)
    if (stored) return JSON.parse(stored) as T
  } catch {
    // sessionStorage not available
  }
  return null
}

function clearSession(key: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}-${key}`)
  } catch {
    // localStorage not available
  }
}

function clearAllSession() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // localStorage not available
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })
  const [authReady, setAuthReady] = useState(false)

  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [contributions, setContributions] = useState<Contribution[]>(mockContributions)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([])
  const [recoveryTokens, setRecoveryTokens] = useState<PasswordRecoveryToken[]>([])

  // Rehydrate all state from sessionStorage on mount
  useEffect(() => {
    const storedAuth = loadFromSession<AuthState>("auth")
    if (storedAuth?.isAuthenticated && storedAuth.user) {
      setAuth(storedAuth)
    }

    const storedGoals = loadFromSession<Goal[]>("goals")
    if (storedGoals) setGoals(storedGoals)

    const storedContributions = loadFromSession<Contribution[]>("contributions")
    if (storedContributions) setContributions(storedContributions)

    const storedNotifications = loadFromSession<Notification[]>("notifications")
    if (storedNotifications) setNotifications(storedNotifications)

    const storedUsers = loadFromSession<User[]>("users")
    if (storedUsers) setRegisteredUsers(storedUsers)

    setAuthReady(true)
  }, [])

  // Persist auth changes
  useEffect(() => {
    if (authReady) {
      if (auth.isAuthenticated) {
        saveToSession("auth", auth)
      } else {
        clearSession("auth")
      }
    }
  }, [auth, authReady])

  // Persist goals changes
  useEffect(() => {
    if (authReady) saveToSession("goals", goals)
  }, [goals, authReady])

  // Persist contributions changes
  useEffect(() => {
    if (authReady) saveToSession("contributions", contributions)
  }, [contributions, authReady])

  // Persist notifications changes
  useEffect(() => {
    if (authReady) saveToSession("notifications", notifications)
  }, [notifications, authReady])

  // Persist registered users changes
  useEffect(() => {
    if (authReady) saveToSession("users", registeredUsers)
  }, [registeredUsers, authReady])

  // Helper: get all known users (mock + registered)
  const allUsers = useMemo(() => [...mockUsers, ...registeredUsers], [registeredUsers])

  // Filtered data for the current authenticated user
  const userId = auth.user?.id
  const userGoals = useMemo(() => goals.filter((g) => g.userId === userId), [goals, userId])
  const userGoalIds = useMemo(() => new Set(userGoals.map((g) => g.id)), [userGoals])
  const userContributions = useMemo(() => contributions.filter((c) => userGoalIds.has(c.goalId)), [contributions, userGoalIds])
  const userNotifications = useMemo(() => notifications.filter((n) => n.userId === userId), [notifications, userId])

  const login = useCallback(
    (email: string, password: string) => {
      const found = allUsers.find((u) => u.email === email)
      if (!found) return { success: false, error: "Credenciales incorrectas" }
      if (password.length < 12) return { success: false, error: "Credenciales incorrectas" }
      const newAuth = {
        user: found,
        token: `mock-jwt-token-${Date.now()}`,
        isAuthenticated: true,
      }
      setAuth(newAuth)
      saveToSession("auth", newAuth)
      return { success: true }
    },
    [allUsers]
  )

  const register = useCallback(
    (name: string, email: string, password: string) => {
      if (password.length < 12)
        return { success: false, error: "La contrasena debe tener al menos 12 caracteres" }
      const exists = allUsers.find((u) => u.email === email)
      if (exists) return { success: false, error: "Este correo ya esta registrado" }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: "user",
        createdAt: new Date().toISOString(),
      }
      setRegisteredUsers((prev) => {
        const updated = [...prev, newUser]
        saveToSession("users", updated)
        return updated
      })
      return { success: true }
    },
    [allUsers]
  )

  const logout = useCallback(() => {
    setAuth({ user: null, token: null, isAuthenticated: false })
    setGoals(mockGoals)
    setContributions(mockContributions)
    setNotifications(mockNotifications)
    // Keep registeredUsers in localStorage - don't clear them on logout
    clearSession("auth")
    clearSession("goals")
    clearSession("contributions")
    clearSession("notifications")
  }, [])

  const recoverPassword = useCallback(
    (email: string) => {
      const found = allUsers.find((u) => u.email === email)
      if (!found)
        return { success: false, error: "No se encontro una cuenta con este correo" }

      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const recoveryToken: PasswordRecoveryToken = {
        email,
        token,
        newPassword: "",
        expiresAt: Date.now() + 3600000, // 1 hour
      }

      setRecoveryTokens((prev) => {
        const filtered = prev.filter((t) => t.email !== email) // Remove old tokens for this email
        return [...filtered, recoveryToken]
      })

      // Send email via our API
      const resetLink = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

      fetch("/api/auth/recover-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetLink }),
      }).catch((error) => {
        console.error("Failed to send recovery email:", error)
      })

      return { success: true }
    },
    [allUsers]
  )

  const resetPassword = useCallback(
    (email: string, newPassword: string, token: string) => {
      const found = allUsers.find((u) => u.email === email)
      if (!found) return { success: false, error: "Cuenta no encontrada" }

      const recoveryToken = recoveryTokens.find(
        (t) => t.email === email && t.token === token && t.expiresAt > Date.now()
      )
      if (!recoveryToken)
        return { success: false, error: "Token inválido o expirado" }

      // Update the user in registeredUsers since mock users can't be modified
      setRegisteredUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.email === email) {
            return { ...u, password: newPassword }
          }
          return u
        })
        saveToSession("users", updated)
        return updated
      })

      // Remove used token
      setRecoveryTokens((prev) => prev.filter((t) => t.token !== token))

      return { success: true }
    },
    [allUsers, recoveryTokens]
  )

  const addGoal = useCallback(
    (goal: Omit<Goal, "id" | "userId" | "currentAmount" | "status" | "createdAt">) => {
      const newGoal: Goal = {
        ...goal,
        id: `goal-${Date.now()}`,
        userId: auth.user?.id || "user-1",
        currentAmount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      }
      setGoals((prev) => [...prev, newGoal])
    },
    [auth.user?.id]
  )

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    )
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    setContributions((prev) => prev.filter((c) => c.goalId !== id))
  }, [])

  const addContribution = useCallback(
    (goalId: string, amount: number, date: string) => {
      if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" }
      const goal = goals.find((g) => g.id === goalId)
      if (!goal) return { success: false, error: "Meta no encontrada" }

      const newContribution: Contribution = {
        id: `c-${Date.now()}`,
        goalId,
        amount,
        date,
        createdAt: new Date().toISOString(),
      }
      setContributions((prev) => [...prev, newContribution])

      const newAmount = goal.currentAmount + amount
      const isCompleted = newAmount >= goal.targetAmount
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: Math.min(newAmount, g.targetAmount),
                status: isCompleted ? "completed" : g.status,
              }
            : g
        )
      )

      if (goal.status !== "completed" && isCompleted) {
        setNotifications((prev) => [
          {
            id: `n-${Date.now()}`,
            userId: auth.user?.id || "",
            type: "completed",
            message: `Tu meta '${goal.name}' ha sido completada. Felicidades!`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      }

      return { success: true }
    },
    [goals]
  )

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === auth.user?.id ? { ...n, read: true } : n))
    )
  }, [auth.user?.id])

  const value = useMemo(
    () => ({
      auth,
      authReady,
      userGoals,
      userContributions,
      userNotifications,
      login,
      register,
      logout,
      recoverPassword,
      resetPassword,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      auth,
      authReady,
      userGoals,
      userContributions,
      userNotifications,
      login,
      register,
      logout,
      recoverPassword,
      resetPassword,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
