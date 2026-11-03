import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface PolicyContent {
  title: string;
  intro: string;
  sidebarTitle: string;
  articles: { number: string; title: string; paragraphs: string[] }[];
}

const anchor = (n: string) => `policy-section-${n}`;

/** Readable policy layout: sticky "On this page" sidebar with scroll-spy + numbered article cards. */
export function PolicyArticles({ content }: { content: PolicyContent }) {
  const [active, setActive] = useState(content.articles[0]?.number);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let current = content.articles[0]?.number;
      for (const a of content.articles) {
        const el = document.getElementById(anchor(a.number));
        if (el && el.getBoundingClientRect().top <= 120) current = a.number;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [content.articles]);

  return (
    <section className="bg-surface-soft px-5 py-16 md:px-10 md:py-[70px] xl:px-gutter" aria-labelledby="policy-heading">
      <div className="mx-auto max-w-page">
        <h2 id="policy-heading" className="text-[28px] font-bold leading-[1.2] text-ink md:text-[34px]">
          {content.title}
        </h2>
        <p className="mt-[19px] max-w-[1140px] text-base leading-[1.45] text-ink-500">{content.intro}</p>
        <div className="mt-10 flex flex-col gap-8 lg:mt-[54px] lg:flex-row lg:items-start lg:gap-9">
          <nav
            aria-label={content.sidebarTitle}
            className="w-full shrink-0 self-start rounded-[18px] border border-policy-sidebarBorder bg-sidebar p-3.5 pb-5 lg:sticky lg:top-6 lg:min-h-[627px] lg:w-[348px]"
          >
            <p className="px-2.5 pb-[17px] pt-[13px] text-base font-bold uppercase leading-[1.2] text-white">{content.sidebarTitle}</p>
            <ul className="grid gap-1 md:grid-cols-2 lg:flex lg:flex-col lg:gap-[15px]">
              {content.articles.map((a) => {
                const on = a.number === active;
                return (
                  <li key={a.number}>
                    <a
                      href={`#${anchor(a.number)}`}
                      aria-current={on ? 'true' : undefined}
                      onClick={() => setActive(a.number)}
                      className={cn(
                        'flex min-h-11 items-center gap-[3px] rounded-xl px-[15px] py-2 transition-colors lg:min-h-[69px] lg:py-0',
                        on ? 'bg-brand-press text-white' : 'text-brand-pale hover:bg-white/5',
                      )}
                    >
                      <span className="w-[46px] shrink-0 text-[13px] font-bold leading-[1.4]">{a.number}</span>
                      <span className={cn('text-sm leading-[1.36]', on ? 'font-bold' : 'font-medium')}>{a.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex min-w-0 flex-1 flex-col gap-[22px]">
            {content.articles.map((a, i) => (
              <article
                key={a.number}
                id={anchor(a.number)}
                data-number={a.number}
                className={cn(
                  'scroll-mt-6 rounded-2xl border bg-white px-5 pb-5 pt-6 shadow-policy md:px-7',
                  i % 2 === 0 ? 'border-policy-border' : 'border-policy-borderAlt',
                )}
              >
                <header className="mb-[11px] flex min-h-[43px] items-center gap-4">
                  <span
                    className={cn(
                      'flex h-[33px] w-[35px] shrink-0 items-center justify-center rounded-chip text-xs font-bold text-white',
                      a.number === active ? 'bg-brand-press' : 'bg-brand-steel',
                    )}
                  >
                    {a.number}
                  </span>
                  <h3 className="text-xl font-bold leading-[1.28] text-ink md:text-[25px]">{a.title}</h3>
                </header>
                <div className="text-[15px] leading-[1.48] text-ink-700 [&>p+p]:mt-[22px]">
                  {a.paragraphs.map((p, k) => (
                    <p key={k}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
