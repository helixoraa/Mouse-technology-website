import { PageHero } from '@/components/layout/PageHero';
import type { Segment } from '@/lib/types';

export interface ContactHeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export function ContactHero({ content }: { content?: ContactHeroContent }) {
  return (
    <PageHero
      eyebrow={content?.eyebrow}
      title={content?.title ?? ''}
      lead={content?.lead}
      leadClass="text-base leading-[27px] md:text-lg"
    />
  );
}

export default ContactHero;
