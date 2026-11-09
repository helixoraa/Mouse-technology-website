import { useState } from 'react';
import { cn } from '@/lib/cn';

export interface PolicyContentData {
  heading: string;
  intro: string;
  sidebarTitle: string;
  articles: { number: string; title: string; paragraphs: string[] }[];
}

/** "02 / Readable policy content": heading, "On this page" sidebar and numbered article cards. */
export function PolicyContent({ content }: { content?: PolicyContentData }) {
  const [active, setActive] = useState(0);
  if (!content) return null;
  return (
    <section
      className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:min-h-[1730px] xl:pb-[40px] xl:pt-[70px]"
      aria-labelledby="policy-heading"
    >
      <div className="mx-auto max-w-page">
        <h2 id="policy-heading" className="text-[28px] font-bold leading-10 text-ink md:text-[34px]">
          {content.heading}
        </h2>
        <p className="mt-[15px] max-w-[1140px] text-base leading-6 text-ink-500">{content.intro}</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,348px)_minmax(0,1fr)] lg:gap-9 xl:mt-[57px]">
          <nav
            aria-label={content.sidebarTitle}
            className="h-fit rounded-[18px] border border-policy-sidebarBorder bg-sidebar px-3.5 pb-8 pt-[27px] lg:sticky lg:top-6 lg:mt-[3px] lg:min-h-[627px]"
          >
            <p className="px-2.5 text-base font-bold leading-[1.2] text-white">{content.sidebarTitle}</p>
            <ol className="mt-5 grid gap-1 md:grid-cols-2 lg:flex lg:flex-col lg:gap-[15px]">
              {content.articles.map((a, i) => (
                <li key={a.number}>
                  <a
                    href={`#policy-${a.number}`}
                    onClick={() => setActive(i)}
                    aria-current={active === i ? 'true' : undefined}
                    className={cn(
                      'flex min-h-11 gap-[3px] rounded-xl px-[15px] py-2 transition-colors lg:h-[69px] lg:py-0',
                      active === i
                        ? 'items-center bg-brand-press font-bold text-white'
                        : 'items-center font-medium text-brand-pale hover:bg-white/5 lg:items-start lg:pt-[12px]',
                    )}
                  >
                    <span className={cn('w-[46px] text-[13px] font-bold leading-[1.4]')}>{a.number}</span>
                    <span className="text-sm leading-[1.36]">{a.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex flex-col gap-[22px]">
            {content.articles.map((a, i) => (
              <article
                id={`policy-${a.number}`}
                key={a.number}
                className={cn(
                  'flex scroll-mt-6 flex-col gap-[11px] rounded-2xl border border-solid bg-white px-5 pb-5 pt-6 shadow-card md:px-7',
                  i === 0 ? 'xl:h-[210px]' : 'xl:h-[188px]',
                  i % 2 === 0 ? 'border-policy-border' : 'border-policy-borderAlt',
                )}
              >
                <header className="flex h-[43px] items-center gap-4">
                  <span
                    className={cn(
                      'flex h-[33px] w-[35px] shrink-0 items-center justify-center rounded-chip text-xs font-bold leading-[1.2]',
                      /* Deliberate a11y deviation from Figma (dark-on-dark): white text on the steel chip, same as Terms. */
                      i === active ? 'bg-brand-press text-white' : 'bg-brand-steel text-white',
                    )}
                  >
                    {a.number}
                  </span>
                  <h3 className="text-[20px] font-bold leading-[1.28] text-ink md:text-[25px]">{a.title}</h3>
                </header>
                <div className="flex max-w-[846px] flex-col gap-[22px] text-[15px] leading-[1.48] text-ink-700">
                  {a.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
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

export default PolicyContent;
