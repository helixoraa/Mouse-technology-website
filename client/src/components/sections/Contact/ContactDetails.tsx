import { useSite } from '@/lib/api';
import { mailHref, telHref } from '@/lib/contact';

export interface ContactDetailsContent {
  eyebrow: string;
  title: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
}

/** Gradient "Business details" card; values come from Site settings (admin-editable). */
export function ContactDetails({ content }: { content?: ContactDetailsContent }) {
  const { data: site } = useSite();
  if (!content) return null;
  const rows = [
    { label: content.emailLabel, value: site?.email, href: mailHref(site?.email) },
    { label: content.phoneLabel, value: site?.phone, href: telHref(site?.phone) },
    { label: content.addressLabel, value: site?.address },
  ];
  return (
    <div className="flex h-fit flex-col gap-8 rounded-xl4 border border-white/25 bg-cta-card p-8 text-white md:p-12">
      <p className="text-eyebrow font-semibold uppercase leading-4 text-text-soft">{content.eyebrow}</p>
      <h2 className="text-[28px] font-extrabold leading-10 tracking-[-0.02em] md:text-[32px]">{content.title}</h2>
      <dl className="flex flex-col gap-8">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <dt className="text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-text-soft">{r.label}</dt>
            <dd className="break-words text-lg font-semibold leading-[27px]">
              {r.href ? (
                <a href={r.href} className="inline-block max-w-full hover:underline max-lg:min-h-11 max-lg:py-2">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ContactDetails;
