import { InnerHero, type InnerHeroContent } from '../InnerHero';

export type ContactHeroContent = InnerHeroContent;

export function ContactHero({ content }: { content?: ContactHeroContent }) {
  return <InnerHero content={content} size="page" leadWidth={655} />;
}

export default ContactHero;
