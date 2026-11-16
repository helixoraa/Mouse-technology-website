import { Link } from 'react-router-dom';
import { useSite } from '@/lib/api';
import { mailHref, officesOf, telHref } from '@/lib/contact';
import { Logo } from './Logo';

const contactLinkCls =
  'text-sm font-medium text-white hover:text-brand-sky max-xl:flex max-xl:min-h-11 max-xl:flex-wrap max-xl:items-center';

/** Email and each office phone under the tagline (addresses live on Contact Us and the homepage contact section). */
function FooterContact({ email, offices }: { email: string; offices: ReturnType<typeof officesOf> }) {
  const mail = mailHref(email);
  const phones = offices.filter((o) => telHref(o.phone));
  if (!mail && !phones.length) return null;
  return (
    <ul className="mt-2 flex flex-col gap-2 max-xl:gap-0" aria-label="Contact">
      {mail && (
        <li>
          <a href={mail} className={contactLinkCls}>
            {email}
          </a>
        </li>
      )}
      {phones.map((o, i) => (
        <li key={o.phone + i}>
          <a href={telHref(o.phone)} className={contactLinkCls}>
            {o.name && <span className="mr-1.5 text-text-soft">{o.name}</span>}
            <span className="whitespace-nowrap">{o.phone}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const { data: site } = useSite();
  if (!site) return <footer className="min-h-[386px] bg-navy-950" />;
  const { footer } = site;
  return (
    <footer className="bg-navy-950 px-5 pt-[70px] md:px-10 xl:px-gutter">
      <div className="mx-auto flex max-w-page flex-col gap-11">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="flex flex-col gap-3.5">
            <Logo siteName={site.siteName} logoUrl={site.logoUrl} />
            <p className="w-[300px] max-w-full text-[14.5px] leading-[22px] text-white">{footer.tagline}</p>
            <FooterContact email={site.email} offices={officesOf(site)} />
          </div>
          {/* Phones: link groups flow into two balanced columns (each group kept whole); from 640 the groups sit in a row. */}
          <div className="columns-2 gap-x-6 sm:flex sm:flex-wrap sm:gap-10 lg:gap-20">
            {footer.columns.map((col) => (
              <div key={col.title} className="mb-8 flex break-inside-avoid flex-col gap-3 max-xl:gap-0 sm:mb-0">
                <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-sky max-xl:mb-1">{col.title}</h2>
                {col.links.map((l) => (
                  <Link
                    key={l.href + l.label}
                    to={l.href}
                    className="text-sm font-medium text-white hover:text-brand-sky max-xl:flex max-xl:min-h-11 max-xl:items-center"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/[0.14] py-5">
          <p className="text-[12.5px] text-white">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
