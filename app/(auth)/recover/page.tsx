"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Mail } from "lucide-react"

export default function RecoverPage() {
  const { recoverPassword } = useApp()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    await new Promise((r) => setTimeout(r, 800))

    const result = recoverPassword(email)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || "Error al enviar el enlace")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Enlace enviado</h2>
            <p className="text-sm text-muted-foreground">
              Se envio un enlace de recuperacion a <strong>{email}</strong>.
              Revisa tu bandeja de entrada.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-2">Volver al inicio de sesion</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground font-sans">
          FinGoal AI
        </span>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Recuperar contrasena</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-foreground">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperacion"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Recordaste tu contrasena?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Inicia sesion
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
