import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { Seo } from '@/components/ui/Seo';
import { ProjectGroup, type ProjectGroupContent } from '@/components/sections/Projects/ProjectGroup';
import { ProjectsHero, type ProjectsHeroContent } from '@/components/sections/Projects/ProjectsHero';
import { getSection, usePage, useServices } from '@/lib/api';

export default function ProjectsPage() {
  const { data } = usePage('projects');
  const { data: services = [] } = useServices();
  if (!data) return <div className="min-h-screen bg-hero" />;
  const hero = getSection<ProjectsHeroContent>(data, 'hero');
  const main = getSection<ProjectGroupContent>(data, 'main');
  const planned = getSection<ProjectGroupContent>(data, 'planned');
  const existing = getSection<ProjectGroupContent>(data, 'existing');
  const cta = getSection<CtaContent>(data, 'cta');
  const by = (c: string) => services.filter((s) => s.category === c);
  return (
    <>
      <Seo {...data.seo} />
      {hero && <ProjectsHero content={hero} />}
      {main && <ProjectGroup content={main} services={by('product')} tone="soft" large />}
      {planned && <ProjectGroup content={planned} services={by('planned')} tone="white" />}
      {existing && <ProjectGroup content={existing} services={by('business')} tone="soft" />}
      {cta && <CtaCard content={cta} />}
    </>
  );
}
