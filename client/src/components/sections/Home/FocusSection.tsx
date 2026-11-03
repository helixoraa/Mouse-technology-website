import { SectionHeader } from '@/components/ui/SectionHeader';
import { icons } from '@/lib/icons';
import type { FocusContent } from './types';

export function FocusSection({ content }: { content: FocusContent }) {
  return (
    <section id="focus" aria-label="Our focus" className="bg-white px-5 py-16 md:px-10 xl:px-gutter xl:py-[110px]">
      <div className="mx-auto flex max-w-page flex-col gap-14">
        <SectionHeader title={content.title} subtitle={content.subtitle} description={content.description} />
        <ul className="flex flex-col gap-5 md:flex-row">
          {content.pillars.map((p) => (
            <li key={p.word} className="flex flex-1 flex-col items-start gap-5 rounded-xl2 border border-line bg-white p-8">
              <div className="flex items-start rounded-2xl border border-white/20 bg-tile-focus p-3.5">
                <img src={icons[p.icon]} alt="" className="size-[26px]" />
              </div>
              <p className="text-[40px] font-extrabold tracking-[-0.02em] text-ink">{p.word}</p>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-ink-700">{p.title}</h3>
                <p className="max-w-[330px] text-body-sm text-ink-500">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
