import { Seo } from '@/components/ui/Seo';
import { PolicyArticles, type PolicyContent } from '@/components/sections/Terms/PolicyArticles';
import { PolicyHero, type PolicyHeroContent } from '@/components/sections/Terms/TermsHero';
import { getSection, usePage } from '@/lib/api';

export default function TermsPage() {
  const { data } = usePage('terms');
  if (!data) return <div className="min-h-screen bg-hero" />;
  const hero = getSection<PolicyHeroContent>(data, 'hero');
  const policy = getSection<PolicyContent>(data, 'policy');
  return (
    <>
      <Seo {...data.seo} />
      {hero && <PolicyHero content={hero} />}
      {policy && <PolicyArticles content={policy} />}
    </>
  );
}
