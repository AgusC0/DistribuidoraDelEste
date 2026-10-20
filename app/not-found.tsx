import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-6xl font-bold text-primary">404</p>
      <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-muted-foreground">
        Puede que el producto ya no esté publicado. Buscalo en el catálogo o escribinos por WhatsApp.
      </p>
      <Button nativeButton={false} size="lg" className="h-11 px-6" render={<Link href="/productos" />}>
        Ir al catálogo
      </Button>
    </main>
  )
}
