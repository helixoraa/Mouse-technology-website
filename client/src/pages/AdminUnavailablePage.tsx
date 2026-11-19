import { PageHero } from '@/components/layout/PageHero';
import { Seo } from '@/components/ui/Seo';

/** Static version only (VITE_STATIC_CONTENT=true): there is no API, so /admin shows this instead of the admin portal. */
export default function AdminUnavailablePage() {
  return (
    <>
      <Seo title="Admin unavailable | MAOUAJ Technology" noindex />
      <PageHero
        eyebrow="Admin"
        title={[{ text: 'Admin is ' }, { text: 'temporarily unavailable', accent: true }, { text: '.' }]}
        lead="The admin portal will be back when the full version of the site returns."
      />
    </>
  );
}
