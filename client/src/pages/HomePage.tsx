import type { ComponentType } from 'react';
import { usePage } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { HeroSection } from '@/components/sections/Home/HeroSection';
import { ProductsSection } from '@/components/sections/Home/ProductsSection';
import { BusFareSection } from '@/components/sections/Home/BusFareSection';
import { PaymentSection } from '@/components/sections/Home/PaymentSection';
import { FocusSection } from '@/components/sections/Home/FocusSection';
import { ProjectsSection } from '@/components/sections/Home/ProjectsSection';
import { FaqSection } from '@/components/sections/Home/FaqSection';
import { BlogSection } from '@/components/sections/Home/BlogSection';
import { ContactSection } from '@/components/sections/Home/ContactSection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionComponent = ComponentType<{ content: any }>;

/** Section key -> component. Order and visibility come from the API, so the admin portal can reorder / hide sections. */
const SECTIONS: Record<string, SectionComponent> = {
  hero: HeroSection,
  products: ProductsSection,
  busfare: BusFareSection,
  payment: PaymentSection,
  focus: FocusSection,
  projects: ProjectsSection,
  faq: FaqSection,
  blog: BlogSection,
  cta: ({ content }: { content: CtaContent }) => <CtaCard content={content} />,
  contact: ContactSection,
};

export default function HomePage() {
  const { data, isLoading, isError } = usePage('home');

  if (isLoading) return <div className="min-h-screen bg-hero" aria-busy="true" />;
  if (isError || !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero px-6 text-center text-white" role="alert">
        We could not load this page. Please try again shortly.
      </div>
    );

  return (
    // Figma uses line-height "normal" by default on this frame (explicit leadings override).
    <div className="leading-[normal]">
      <Seo title={data.seo.title} description={data.seo.description} ogImage={data.seo.ogImage} />
      {data.sections.map((s) => {
        const Component = SECTIONS[s.key];
        return Component ? <Component key={s.id} content={s.content} /> : null;
      })}
    </div>
  );
}
