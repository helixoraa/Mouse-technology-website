import { useCallback, useEffect, useRef, useState } from 'react';
import type { Segment, TeamMember } from '@/lib/types';
import { mediaUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InnerBand } from '../InnerBand';

export interface TeamCarouselContent {
  header: { title: Segment[]; subtitle: string; description: string };
  prevLabel: string;
  nextLabel: string;
}

const CARD = 288;
const GAP = 24;

function MemberCard({ m }: { m: TeamMember }) {
  return (
    <li className="flex w-[288px] shrink-0 snap-start flex-col items-center gap-5">
      <div className="h-[336px] w-[288px] overflow-hidden">
        {m.photo ? (
          <img
            src={mediaUrl(m.photo)}
            alt={`Portrait placeholder for ${m.name}`}
            className={m.photo.endsWith('.svg') ? 'size-full' : 'mt-6 h-[296px] w-full'}
            draggable={false}
          />
        ) : (
          <div className="size-full bg-surface-tint" />
        )}
      </div>
      <div className="flex w-full flex-col items-center gap-1.5 text-center">
        <h3 className="w-full text-[22px] font-bold text-ink">{m.name}</h3>
        <p className="w-full text-sm font-semibold text-brand">{m.role}</p>
        <p className="w-full text-[13.5px] leading-5 text-ink-500">{m.bio}</p>
      </div>
    </li>
  );
}

/** Scroll-snap carousel with Prev/Next controls and dash pagination (Figma "02 / TEAM CAROUSEL"). */
export function TeamCarousel({ content, members }: { content: TeamCarouselContent; members: TeamMember[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [max, setMax] = useState(0);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const step = CARD + GAP;
    setMax(Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step)));
    setIndex(Math.min(Math.round(el.scrollLeft / step), Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step))));
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, members.length]);

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(max, i));
    track.current?.scrollTo({ left: next * (CARD + GAP), behavior: 'smooth' });
  };

  const btn =
    'flex size-[72px] flex-col items-center justify-center gap-1.5 rounded-full border border-line bg-surface-tint transition-opacity md:size-[104px]';

  return (
    <InnerBand tone="white" className="gap-10 xl:gap-16">
      <SectionHeader {...content.header} />
      <ul
        ref={track}
        onScroll={measure}
        aria-label="Team members"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {members.map((m) => (
          <MemberCard key={m.id} m={m} />
        ))}
      </ul>
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index <= 0}
          aria-label="Previous team members"
          className={cn(btn, 'disabled:opacity-60')}
        >
          <span className="text-sm font-bold text-ink-700">{content.prevLabel}</span>
          <span aria-hidden className="text-base font-semibold text-brand">
            ←
          </span>
        </button>
        <div className="flex items-center gap-2" role="group" aria-label="Carousel position">
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to position ${i + 1}`}
              aria-current={i === index}
              className="flex h-6 items-center"
            >
              <span className={cn('block h-[3px] rounded-[2px] transition-all', i === index ? 'w-9 bg-brand-sky' : 'w-7 bg-line-dash')} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index >= max}
          aria-label="Next team members"
          className={cn(btn, 'disabled:opacity-60')}
        >
          <span className="text-sm font-bold text-ink-700">{content.nextLabel}</span>
          <span aria-hidden className="text-base font-semibold text-brand">
            →
          </span>
        </button>
      </div>
    </InnerBand>
  );
}
