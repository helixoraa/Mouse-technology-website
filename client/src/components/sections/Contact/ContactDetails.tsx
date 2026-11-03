import { useSite } from '@/lib/api';

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
    {
      label: content.emailLabel,
      value: site?.email,
      href: site?.email && !site.email.startsWith('[') ? `mailto:${site.email}` : undefined,
    },
    { label: content.phoneLabel, value: site?.phone, href: site?.phone && !site.phone.startsWith('[') ? `tel:${site.phone}` : undefined },
    { label: content.addressLabel, value: site?.address },
  ];
  return (
    <div className="flex h-fit flex-col gap-7 rounded-xl4 border border-white/25 bg-cta-card p-8 text-white md:px-12 md:pb-[26px] md:pt-12">
      <p className="text-eyebrow font-semibold uppercase text-text-soft">{content.eyebrow}</p>
      <h2 className="text-[28px] font-bold leading-tight md:text-[32px]">{content.title}</h2>
      <dl className="mt-5 flex flex-col gap-[30px]">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-text-soft">{r.label}</dt>
            <dd className="break-words text-xl font-medium leading-snug">
              {r.href ? (
                <a href={r.href} className="hover:underline">
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
