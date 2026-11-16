import { useSite } from '@/lib/api';
import { mailHref, officesOf, telHref } from '@/lib/contact';
import type { SiteSettings } from '@/lib/types';
import { Segments } from '@/components/ui/Heading';
import { ContactForm } from '../Contact/ContactForm';
import { homeIcons } from './homeIcons';
import type { ContactContent } from './types';

const linkCls = 'hover:text-brand max-lg:inline-flex max-lg:min-h-11 max-lg:items-center';

/** One contact row's value: the email, every office phone, or every office address (with the office name). */
function DetailValue({ field, site }: { field: 'email' | 'phone' | 'address'; site?: SiteSettings }) {
  if (field === 'email') {
    const href = mailHref(site?.email);
    return (
      <p className="break-words text-base font-semibold">
        {href ? (
          <a href={href} className={linkCls}>
            {site?.email}
          </a>
        ) : (
          site?.email
        )}
      </p>
    );
  }
  const offices = officesOf(site);
  return (
    <ul className="flex flex-col gap-1 max-lg:gap-0">
      {offices.map((o, i) => {
        const value = field === 'phone' ? o.phone : o.address;
        if (!value) return null;
        const href = field === 'phone' ? telHref(value) : undefined;
        return (
          <li key={i} className="text-base [overflow-wrap:anywhere]">
            {o.name && <span className="text-ink-500">{o.name}: </span>}
            {href ? (
              <a href={href} className={`font-semibold ${linkCls}`}>
                {value}
              </a>
            ) : (
              <span className={field === 'phone' || !o.name ? 'font-semibold' : 'font-medium'}>{value}</span>
            )}
          </li>
        );
      })}
    </ul>
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
              <li key={d.field} className="flex min-w-0 items-center gap-4 text-ink-700">
                <div className="flex shrink-0 items-start rounded-[14px] bg-tile-project p-3">
                  <img src={homeIcons[d.icon]} alt="" className="size-5" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-xs">{d.label}</p>
                  <DetailValue field={d.field} site={site} />
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
