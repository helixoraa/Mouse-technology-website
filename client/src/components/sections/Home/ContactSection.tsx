import { useSite } from '@/lib/api';
import { mailHref, telHref } from '@/lib/contact';
import { Segments } from '@/components/ui/Heading';
import { ContactForm } from '../Contact/ContactForm';
import { homeIcons } from './homeIcons';
import type { ContactContent } from './types';

/** Email and telephone become mailto:/tel: links once they are real values (placeholders stay plain text). */
function DetailValue({ field, value }: { field: 'email' | 'phone' | 'address'; value?: string }) {
  const href = field === 'email' ? mailHref(value) : field === 'phone' ? telHref(value) : undefined;
  if (!href) return <>{value}</>;
  return (
    <a href={href} className="hover:text-brand max-lg:inline-flex max-lg:min-h-11 max-lg:items-center">
      {value}
    </a>
  );
}

export function ContactSection({ content }: { content: ContactContent }) {
  const { data: site } = useSite();
  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,616fr)_minmax(0,600fr)] lg:items-start xl:gap-20">
        <div className="flex flex-col items-start gap-6">
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
                  <p className="break-words text-base font-semibold">
                    <DetailValue field={d.field} value={site?.[d.field]} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full">
          <ContactForm content={content.form} variant="compact" />
        </div>
      </div>
    </section>
  );
}
