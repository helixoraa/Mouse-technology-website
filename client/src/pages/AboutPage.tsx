import { PageHero } from '@/components/layout/PageHero';
import { Seo } from '@/components/ui/Seo';
import { Areas, type AreasContent } from '@/components/sections/About/Areas';
import { Purpose, type PurposeContent } from '@/components/sections/About/Purpose';
import { WhoWeAre, type WhoWeAreContent } from '@/components/sections/About/WhoWeAre';
import { getSection, usePage } from '@/lib/api';
import type { Segment } from '@/lib/types';

interface HeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export default function AboutPage() {
  const { data } = usePage('about');
  if (!data) return <div className="min-h-screen bg-hero" />;
  const hero = getSection<HeroContent>(data, 'hero');
  const who = getSection<WhoWeAreContent>(data, 'who-we-are');
  const areas = getSection<AreasContent>(data, 'areas');
  const purpose = getSection<PurposeContent>(data, 'purpose');
  return (
    <>
      <Seo {...data.seo} />
      {hero && <PageHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} leadClass="text-xl leading-7" />}
      {who && <WhoWeAre content={who} />}
      {areas && <Areas content={areas} />}
      {purpose && <Purpose content={purpose} />}
    </>
  );
}
