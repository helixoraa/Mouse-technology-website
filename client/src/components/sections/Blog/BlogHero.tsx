import { InnerHero, type InnerHeroContent } from '../InnerHero';

export type BlogHeroContent = InnerHeroContent;

/** Blog & Updates hero. */
export function BlogHero({ content }: { content?: BlogHeroContent }) {
  return <InnerHero content={content} size="hero" leadWidth={745} />;
}

export default BlogHero;
