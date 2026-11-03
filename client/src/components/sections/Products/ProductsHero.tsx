import { InnerHero, type InnerHeroContent } from '../InnerHero';

export type ProductsHeroContent = InnerHeroContent;

export function ProductsHero({ content }: { content?: ProductsHeroContent }) {
  return <InnerHero content={content} size="page" leadWidth={655} />;
}

export default ProductsHero;
