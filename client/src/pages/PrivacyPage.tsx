import { getSection, usePage } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { LegalHero, type LegalHeroContent } from '@/components/sections/Privacy/PrivacyHero';
import { PolicyContent, type PolicyContentData } from '@/components/sections/Privacy/PolicyContent';

export default function PrivacyPage() {
  const { data } = usePage('privacy');
  // Same reserved space as the other pages while loading, so the footer does not jump when the policy arrives.
  if (!data) return <div className="min-h-screen bg-hero" />;
  return (
    <>
      <Seo title={data.seo.title} description={data.seo.description} ogImage={data.seo.ogImage} />
      <LegalHero content={getSection<LegalHeroContent>(data, 'hero')} />
      <PolicyContent content={getSection<PolicyContentData>(data, 'policy')} />
    </>
  );
}
