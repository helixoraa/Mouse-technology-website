import ellipseAlt from '@/assets/svg/ellipse-hero-alt.svg';
import { InnerHero, type InnerHeroContent } from '../InnerHero';

export type LegalHeroContent = InnerHeroContent;

/** Privacy Policy hero: accent bar, bold eyebrow, 52px heading, lead, keyline. */
export function LegalHero({ content }: { content?: LegalHeroContent }) {
  return <InnerHero content={content} size="hero" accentBar leadWidth={745} ellipse={ellipseAlt} />;
}

export default LegalHero;
