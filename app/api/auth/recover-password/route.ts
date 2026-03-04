import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const isValidApiKey = (key: string) => {
  return key && key.startsWith("re_") && key.length > 10
}

const resend = new Resend(
  isValidApiKey(process.env.RESEND_API_KEY || "") ? process.env.RESEND_API_KEY : undefined
)

export async function POST(request: NextRequest) {
  try {
    const { email, resetLink } = await request.json()

    if (!email || !resetLink) {
      return NextResponse.json(
        { error: "Email and resetLink are required" },
        { status: 400 }
      )
    }

    // If API key is not valid, use demo mode
    if (!isValidApiKey(process.env.RESEND_API_KEY || "")) {
      console.log("\n═══════════════════════════════════════════════════════════════")
      console.log("🔑 PASSWORD RECOVERY - DEMO MODE (SIN API KEY CONFIGURADA)")
      console.log("═══════════════════════════════════════════════════════════════")
      console.log(`📧 Email: ${email}`)
      console.log(`\n🔗 Reset Link:`)
      console.log(`${resetLink}`)
      console.log("\n💡 Copiar este link y pegarlo en el navegador para probar.")
      console.log("═══════════════════════════════════════════════════════════════\n")
      return NextResponse.json({
        success: true,
        message: "Demo mode: Check server logs for the reset link",
      })
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Recupera tu contraseña en FinGoal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recupera tu contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en FinGoal. Haz clic en el siguiente enlace para cambiarla:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">O copia este enlace en tu navegador:</p>
          <p style="color: #0066cc; word-break: break-all; font-size: 12px;">${resetLink}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Si no solicitaste este cambio, ignora este correo. El enlace vence en 1 hora.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            FinGoal - Gestión de metas financieras
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error("Resend error:", result.error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error("Recovery email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
