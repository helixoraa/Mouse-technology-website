import { getSection, usePage } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { ContactHero, type ContactHeroContent } from '@/components/sections/Contact/ContactHero';
import { ContactTopics, type ContactTopicsContent } from '@/components/sections/Contact/ContactTopics';
import { ContactDetails, type ContactDetailsContent } from '@/components/sections/Contact/ContactDetails';
import { ContactForm, type ContactFormContent } from '@/components/sections/Contact/ContactForm';

export default function ContactPage() {
  const { data } = usePage('contact');
  if (!data) return <div className="min-h-screen bg-hero" />;
  return (
    <>
      <Seo title={data?.seo.title} description={data?.seo.description} ogImage={data?.seo.ogImage} />
      <ContactHero content={getSection<ContactHeroContent>(data, 'hero')} />
      <ContactTopics content={getSection<ContactTopicsContent>(data, 'topics')} />
      <section className="bg-white px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]" aria-label="Contact details and inquiry form">
        <div className="mx-auto grid max-w-page items-start gap-6 lg:grid-cols-[minmax(0,480fr)_minmax(0,792fr)]">
          <ContactDetails content={getSection<ContactDetailsContent>(data, 'details')} />
          <ContactForm variant="dark" showConsent={false} content={getSection<ContactFormContent>(data, 'form')} />
        </div>
      </section>
    </>
  );
}
