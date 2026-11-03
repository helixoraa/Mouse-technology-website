import { getSection, usePage } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { ProductsHero, type ProductsHeroContent } from '@/components/sections/Products/ProductsHero';
import { ProductFeature, type ProductFeatureContent } from '@/components/sections/Products/ProductFeature';
import { PlannedProducts, type PlannedProductsContent } from '@/components/sections/Products/PlannedProducts';

export default function ProductsPage() {
  const { data } = usePage('products');
  const cta = getSection<CtaContent>(data, 'cta');
  return (
    <>
      <Seo title={data?.seo.title} description={data?.seo.description} ogImage={data?.seo.ogImage} />
      <ProductsHero content={getSection<ProductsHeroContent>(data, 'hero')} />
      <ProductFeature id="bus-fare" content={getSection<ProductFeatureContent>(data, 'busFare')} />
      <ProductFeature id="payment" content={getSection<ProductFeatureContent>(data, 'payment')} />
      <PlannedProducts content={getSection<PlannedProductsContent>(data, 'planned')} />
      {cta && <CtaCard content={cta} />}
    </>
  );
}
