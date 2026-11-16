import { useSite } from '@/lib/api';
import { mailHref, officesOf, telHref } from '@/lib/contact';

export interface ContactDetailsContent {
  eyebrow: string;
  title: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
}

const labelCls = 'text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-text-soft';
const valueCls = 'break-words text-lg font-semibold leading-[27px]';
/** Phones: links get a 44px tap height. */
const linkCls = 'inline-block max-w-full hover:underline max-lg:min-h-11 max-lg:py-2';

function Value({ value, href }: { value?: string; href?: string }) {
  if (!value) return null;
  return href ? (
    <a href={href} className={linkCls}>
      {value}
    </a>
  ) : (
    <>{value}</>
  );
}

/** Gradient "Business details" card: email, then one block per office. Values come from Site settings (admin-editable). */
export function ContactDetails({ content }: { content?: ContactDetailsContent }) {
  const { data: site } = useSite();
  if (!content) return null;
  const offices = officesOf(site);
  return (
    <div className="flex h-fit min-w-0 flex-col gap-8 rounded-xl4 border border-white/25 bg-cta-card p-8 text-white md:p-12">
      <p className="text-eyebrow font-semibold uppercase leading-4 text-text-soft">{content.eyebrow}</p>
      <h2 className="text-[28px] font-extrabold leading-10 tracking-[-0.02em] md:text-[32px]">{content.title}</h2>
      <dl className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <dt className={labelCls}>{content.emailLabel}</dt>
          <dd className={valueCls}>
            <Value value={site?.email} href={mailHref(site?.email)} />
          </dd>
        </div>
        {offices.map((o, i) =>
          o.name ? (
            <div key={o.name + i} className="flex flex-col gap-1.5">
              <dt className={labelCls}>{o.name}</dt>
              {o.address && <dd className="text-base leading-6 [overflow-wrap:anywhere]">{o.address}</dd>}
              {o.phone && (
                <dd className={valueCls}>
                  <Value value={o.phone} href={telHref(o.phone)} />
                </dd>
              )}
            </div>
          ) : (
            // Older data: a single unnamed phone/address pair keeps the original two rows.
            <div key={'legacy' + i} className="flex flex-col gap-8">
              <div className="flex flex-col gap-1.5">
                <dt className={labelCls}>{content.phoneLabel}</dt>
                <dd className={valueCls}>
                  <Value value={o.phone} href={telHref(o.phone)} />
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className={labelCls}>{content.addressLabel}</dt>
                <dd className={valueCls}>{o.address}</dd>
              </div>
            </div>
          ),
        )}
      </dl>
    </div>
  );
}

export default ContactDetails;
