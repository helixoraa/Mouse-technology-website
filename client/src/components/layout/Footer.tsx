import { Link } from 'react-router-dom';
import { useSite } from '@/lib/api';
import { Logo } from './Logo';

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
          </div>
          <div className="flex flex-wrap gap-10 lg:gap-20">
            {footer.columns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-sky">{col.title}</h2>
                {col.links.map((l) => (
                  <Link key={l.href + l.label} to={l.href} className="text-sm font-medium text-white hover:text-brand-sky">
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
