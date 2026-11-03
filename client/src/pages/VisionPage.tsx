import { PageHero } from '@/components/layout/PageHero';
import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { Seo } from '@/components/ui/Seo';
import { Pillars, type PillarsContent } from '@/components/sections/Vision/Pillars';
import { Roadmap, type RoadmapContent } from '@/components/sections/Vision/Roadmap';
import { VisionMission, type VisionMissionContent } from '@/components/sections/Vision/VisionMission';
import { getSection, usePage } from '@/lib/api';
import type { Segment } from '@/lib/types';

interface HeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export default function VisionPage() {
  const { data } = usePage('vision');
  if (!data) return <div className="min-h-screen bg-hero" />;
  const hero = getSection<HeroContent>(data, 'hero');
  const vm = getSection<VisionMissionContent>(data, 'vision-mission');
  const pillars = getSection<PillarsContent>(data, 'pillars');
  const roadmap = getSection<RoadmapContent>(data, 'roadmap');
  const cta = getSection<CtaContent>(data, 'cta');
  return (
    <>
      <Seo {...data.seo} />
      {hero && <PageHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} leadClass="text-xl leading-7" />}
      {vm && <VisionMission content={vm} />}
      {pillars && <Pillars content={pillars} />}
      {roadmap && <Roadmap content={roadmap} />}
      {cta && <CtaCard content={cta} />}
    </>
  );
}
