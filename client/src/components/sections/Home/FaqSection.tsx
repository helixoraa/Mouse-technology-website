import { useState } from 'react';
import { useFaqs } from '@/lib/api';
import { cn } from '@/lib/cn';
import toggleOpen from '@/assets/svg/home-toggle-open.svg';
import toggleClosed from '@/assets/svg/home-toggle-closed.svg';
import type { FaqContent } from './types';

export function FaqSection({ content }: { content: FaqContent }) {
  const { data: faqs = [] } = useFaqs();
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const active = openId === undefined ? faqs[0]?.id : openId;

  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-surface-soft px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]">
      <div className="mx-auto flex max-w-page flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,440fr)_minmax(0,776fr)] xl:gap-20">
        <div className="flex flex-col gap-[18px]">
          <h2 id="faq-heading" className="text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] xl:text-h-section xl:leading-[58px]">
            {content.titleLines.map((l, i) => (
              <span key={i} className={cn('block', l.accent ? 'text-brand' : 'text-ink')}>
                {l.text}
              </span>
            ))}
          </h2>
          <p className="max-w-[380px] text-lg font-medium leading-[25px] text-ink xl:text-xl">{content.lead}</p>
        </div>
        <ul className="flex flex-1 flex-col gap-3.5">
          {faqs.map((f) => {
            const open = active === f.id;
            return (
              <li
                key={f.id}
                className={cn(
                  'flex flex-col gap-3.5 rounded-3xl border p-6 sm:p-7',
                  open ? 'border-brand/40 bg-mock-faqOpen' : 'border-line bg-white',
                )}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`faq-${f.id}`}
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex w-full items-center justify-between gap-4 text-left max-xl:min-h-11"
                  >
                    <span className="text-lg font-bold text-ink-700">{f.question}</span>
                    <span className={cn('flex shrink-0 items-start rounded-pill p-2', open ? 'bg-mock-blue' : 'bg-line-dash')}>
                      <img src={open ? toggleOpen : toggleClosed} alt="" className="size-4" />
                    </span>
                  </button>
                </h3>
                {open && f.answer && (
                  <p id={`faq-${f.id}`} className="max-w-[640px] text-base leading-6 text-ink-700">
                    {f.answer}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
