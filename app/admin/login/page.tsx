import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BadgePercent, ClipboardList, Tags } from 'lucide-react'
import { Logo } from '@/components/logo'
import { LoginForm } from '@/components/admin/login-form'
import { Auth5 } from '@/components/ui/auth-5'
import { readDb } from '@/lib/db'
import { isAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Ingresar al panel', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect('/admin')
  const { next } = await searchParams
  const devHint = process.env.NODE_ENV !== 'production' && !process.env.ADMIN_PASSWORD
  const misconfigured = process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD
  const { settings } = await readDb()

  return (
    <Auth5
      logo={<Logo className="h-12 sm:h-14" />}
      heading="Ingresá al panel"
      subtext={
        <>
          Gestioná productos, precios, promociones y pedidos de la web de <span className="font-medium text-foreground">{settings.businessName}</span>.
        </>
      }
      image={{ src: '/images/local/local-distribuidora-del-este-villa-maria.jpg', alt: 'Fachada del local de Distribuidora del Este en Villa María' }}
      panelHeading="Todo tu negocio online, en un solo lugar"
      features={[
        { icon: <ClipboardList className="size-5" />, title: 'Pedidos al día', description: 'Cada pedido de WhatsApp queda guardado con sus productos y precios.' },
        { icon: <Tags className="size-5" />, title: 'Precios y stock al instante', description: 'Cambiás uno o cientos a la vez, y se ve en la web enseguida.' },
        { icon: <BadgePercent className="size-5" />, title: 'Promociones que se ven', description: 'Tus ofertas aparecen primero en la portada y en el menú.' },
      ]}
      footer={
        <div className="space-y-4">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            ¿Olvidaste la contraseña? Pedísela a quien administra el sitio.
          </p>
          {devHint && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Modo prueba: usuario <code className="font-semibold">admin</code> y contraseña <code className="font-semibold">admin</code>. Se cambian con
              ADMIN_USER y ADMIN_PASSWORD en <code>.env.local</code>.
            </p>
          )}
        </div>
      }
    >
      {misconfigured && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Falta configurar la variable de entorno ADMIN_PASSWORD en el servidor.</p>
      )}
      <LoginForm next={next ?? ''} />
    </Auth5>
  )
}
