import { PageHero } from '@/components/layout/PageHero';
import { Seo } from '@/components/ui/Seo';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found | MAOUAJ Technology" />
      <PageHero
        eyebrow="404"
        title={[{ text: 'This page ' }, { text: 'could not be found', accent: true }, { text: '.' }]}
        lead="Use the navigation above to find what you were looking for."
      />
    </>
  );
}
