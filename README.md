# FinGoal

Aplicación de demostración para gestionar metas financieras desarrollada con **Next.js 13 App Router**, **React 19**, **Tailwind CSS** y librerías de UI personalizadas.

El objetivo es ofrecer una plantilla interactiva para:

- Crear/editar/eliminar metas de ahorro
- Registrar aportes
- Visualizar reportes y gráficos
- Funcionalidades de autenticación, registro y recuperación de contraseña

## Características principales

- Autenticación mediante email (simulada)
- Generación y descarga de reportes PDF usando `jsPDF`
- Recuperación de contraseña con envío de correo (integración Resend)
- Datos persistidos en `localStorage`
- Componentes UI reutilizables bajo `components/ui`

## Requisitos

- Node.js 20+ / 22+ (la versión usada en desarrollo: 22.17.1)
- [pnpm](https://pnpm.io/) (el repo incluye `pnpm-lock.yaml`)

## Instalación y ejecución

```bash
# clona el repositorio
git clone <url-del-repo>
cd FinGoal

# instala dependencias
pnpm install

# crea archivo de entorno
cp .env.local.example .env.local
# o edita .env.local manualmente

# iniciar servidor de desarrollo
pnpm dev
```

La app correrá en http://localhost:3000 (o 3001 si el puerto 3000 está ocupado).

## Configuración de correo

Para habilitar el envío de correos de recuperación de contraseña, configura una API key de [Resend](https://resend.com):

1. Regístrate en https://resend.com
2. Obtén tu API key desde https://resend.com/api-keys
3. Colócala en `.env.local`:
   ```env
   RESEND_API_KEY=re_abc123...
   ```

Si no configuras la clave, el sistema funcionará en modo demo mostrando el enlace de recuperación en la consola del servidor.

## Script útiles

- `pnpm dev` – ejecutar servidor en modo desarrollo
- `pnpm build` – generar compilación de producción
- `pnpm start` – iniciar servidor de producción
- `pnpm lint` – ejecutar ESLint en todo el proyecto

## Estructura de carpetas

```text
app/                # rutas de Next.js (App Router)
components/         # componentes reutilizables y UI
hooks/              # Hooks personalizados
lib/                # lógica compartida (contexto, utilidades, tipos, datos simulados)
public/             # archivos estáticos
styles/             # hojas globales (Tailwind override)
```

## Notas

- Los datos de usuarios, metas y aportes se guardan en `localStorage`.
- El servidor API es simulado; no hay base de datos real.
- Perfecto como un punto de partida o demo para ideas de finanzas personales.

---

¡Disfruta construyendo con FinGoal! 🎯