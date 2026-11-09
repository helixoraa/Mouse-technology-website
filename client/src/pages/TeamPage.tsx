import { PageHero } from '@/components/layout/PageHero';
import { Seo } from '@/components/ui/Seo';
import { Leadership, type LeadershipContent } from '@/components/sections/Team/Leadership';
import { TeamGrid, type TeamGridContent } from '@/components/sections/Team/TeamGrid';
import { getSection, usePage, useTeam } from '@/lib/api';
import type { Segment } from '@/lib/types';

interface HeroContent {
  eyebrow: string;
  title: Segment[];
  lead: string;
}

export default function TeamPage() {
  const { data } = usePage('team');
  const { data: members = [] } = useTeam();
  if (!data) return <div className="min-h-screen bg-hero" />;
  const hero = getSection<HeroContent>(data, 'hero');
  const leadership = getSection<LeadershipContent>(data, 'leadership');
  const team = getSection<TeamGridContent>(data, 'team-carousel');
  return (
    <>
      <Seo {...data.seo} />
      {hero && <PageHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead} leadClass="text-lg leading-[1.5]" />}
      {leadership && <Leadership content={leadership} />}
      {team && <TeamGrid content={team} members={members} />}
    </>
  );
}
