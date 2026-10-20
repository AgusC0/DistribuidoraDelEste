import { Hero } from '@/components/hero'
import { FeaturedProducts } from '@/components/featured-products'
import { Features } from '@/components/features'
import { About } from '@/components/about'
import { Contact } from '@/components/contact'
import { getPublicCatalog } from '@/lib/db'

export default async function Page() {
  const { settings } = await getPublicCatalog()
  return (
    <>
      <Hero settings={settings} />
      <FeaturedProducts />
      <Features />
      <About settings={settings} />
      <Contact />
    </>
  )
}
