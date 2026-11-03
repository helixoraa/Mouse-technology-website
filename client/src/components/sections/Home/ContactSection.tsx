import { useSite } from '@/lib/api';
import { Segments } from '@/components/ui/Heading';
import { ContactForm } from '../Contact/ContactForm';
import { homeIcons } from './homeIcons';
import type { ContactContent } from './types';

export function ContactSection({ content }: { content: ContactContent }) {
  const { data: site } = useSite();
  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 xl:flex-row xl:items-start xl:gap-20">
        <div className="flex flex-col items-start gap-6 xl:flex-1">
          <h2 id="contact-heading" className="text-[40px] font-bold leading-[1.15] tracking-[-0.025em] xl:text-[56px] xl:leading-[65px]">
            <Segments parts={content.title} accentClass="text-brand" baseClass="text-ink" />
          </h2>
          <p className="max-w-[440px] text-base leading-[25px] text-ink-700">{content.lead}</p>
          <ul className="flex flex-col gap-6">
            {content.details.map((d) => (
              <li key={d.field} className="flex items-center gap-4 text-ink-700">
                <div className="flex items-start rounded-[14px] bg-tile-project p-3">
                  <img src={homeIcons[d.icon]} alt="" className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs">{d.label}</p>
                  <p className="text-base font-semibold">{site?.[d.field]}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full xl:w-[600px] xl:shrink-0">
          <ContactForm content={content.form} variant="compact" />
        </div>
      </div>
    </section>
  );
}
