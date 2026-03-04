"use client"

import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileDown, FileText } from "lucide-react"
import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ReportsPage() {
  const { userGoals: goals, userContributions: contributions } = useApp()

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalContributions = contributions.length

  const handleGenerateReport = () => {
    if (goals.length === 0) {
      toast.info("No hay metas registradas para generar un reporte.")
      return
    }

    // create a simple PDF with summary and a table of goals
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Resumen de metas", 14, 20);

      // add totals
      doc.setFontSize(12);
      doc.text(`Total ahorrado: $${totalSaved.toLocaleString()}`, 14, 30);
      doc.text(`Total objetivo: $${totalTarget.toLocaleString()}`, 14, 36);
      doc.text(`Total aportes: ${totalContributions}`, 14, 42);

      // table header
      const startY = 52;
      doc.setFontSize(10);
      doc.text("Meta", 14, startY);
      doc.text("Objetivo", 70, startY, { align: "right" });
      doc.text("Acumulado", 110, startY, { align: "right" });
      doc.text("Progreso", 150, startY, { align: "right" });

      // table rows
      goals.forEach((g, index) => {
        const y = startY + 6 + index * 6;
        const percent =
          g.targetAmount > 0
            ? Math.round((g.currentAmount / g.targetAmount) * 100)
            : 0;
        doc.text(g.name, 14, y);
        doc.text(`$${g.targetAmount.toLocaleString()}`, 70, y, { align: "right" });
        doc.text(`$${g.currentAmount.toLocaleString()}`, 110, y, { align: "right" });
        doc.text(`${percent}%`, 150, y, { align: "right" });
      });

      doc.save("reporte-metas.pdf");
      toast.success("Reporte generado y descargado exitosamente.", {
        description: "El archivo PDF se descargó a tu carpeta de descargas.",
      });
    } catch (e) {
      console.error("Error creando PDF", e);
      toast.error("Ocurrió un error al generar el reporte. Intenta de nuevo más tarde.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Reportes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen y exportacion de tus datos financieros
          </p>
        </div>
        <Button onClick={handleGenerateReport}>
          <FileDown className="mr-2 h-4 w-4" />
          Generar Reporte PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total ahorrado</p>
            <p className="text-3xl font-bold text-primary">${totalSaved.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              de ${totalTarget.toLocaleString()} objetivo
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total de metas</p>
            <p className="text-3xl font-bold text-foreground">{goals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {goals.filter((g) => g.status === "active").length} activas,{" "}
              {goals.filter((g) => g.status === "completed").length} completadas
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total de aportes</p>
            <p className="text-3xl font-bold text-accent">{totalContributions}</p>
            <p className="text-xs text-muted-foreground mt-1">registrados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalle por meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No hay metas registradas aun. Crea tu primera meta para ver el detalle aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Meta</TableHead>
                    <TableHead className="text-foreground text-right">Objetivo</TableHead>
                    <TableHead className="text-foreground text-right">Acumulado</TableHead>
                    <TableHead className="text-foreground text-right">Restante</TableHead>
                    <TableHead className="text-foreground">Progreso</TableHead>
                    <TableHead className="text-foreground">Vencimiento</TableHead>
                    <TableHead className="text-foreground">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => {
                    const percent =
                      goal.targetAmount > 0
                        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                        : 0
                    return (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium text-foreground">{goal.name}</TableCell>
                        <TableCell className="text-right text-foreground">
                          ${goal.targetAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          ${goal.currentAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          ${(goal.targetAmount - goal.currentAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percent} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">{percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {format(new Date(goal.deadline), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              goal.status === "completed"
                                ? "bg-primary/10 text-primary"
                                : "bg-accent/10 text-accent"
                            }`}
                          >
                            {goal.status === "completed" ? "Completada" : "Activa"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
