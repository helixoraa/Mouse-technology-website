import { mediaUrl } from '@/lib/api';
import { Segments } from '@/components/ui/Heading';
import type { BusFareContent } from './types';

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-2 rounded-3xl border border-white/[0.14] bg-white/[0.06] p-[26px]">
      <h3 className="text-lg font-semibold text-text-onDark">{title}</h3>
      <p className="max-w-[250px] text-sm leading-[22px] text-text-muted">{text}</p>
    </div>
  );
}

export function BusFareSection({ content }: { content: BusFareContent }) {
  const [first, ...rest] = content.cards;
  return (
    <section id="bus-fare" aria-labelledby="busfare-heading" className="bg-section-dark px-5 py-16 md:px-10 xl:px-gutter xl:py-[100px]">
      <div className="mx-auto flex max-w-page flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <h2
            id="busfare-heading"
            className="max-w-[900px] text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-text-onDark xl:text-[56px] xl:leading-[56px]"
          >
            <Segments parts={content.title} accentClass="text-brand-sky" />
          </h2>
          <p className="max-w-[580px] text-base leading-[25px] text-white">{content.lead}</p>
        </div>
        <div className="flex w-full flex-col items-center gap-7 xl:flex-row">
          <div className="hidden w-full xl:block xl:flex-1">{first && <InfoCard {...first} />}</div>
          <img
            src={mediaUrl(content.image)}
            alt={content.imageAlt}
            className="aspect-[620/351] w-full max-w-[620px] object-cover xl:h-[351px] xl:w-[620px]"
          />
          <div className="flex w-full flex-col gap-4 xl:flex-1">
            <div className="xl:hidden">{first && <InfoCard {...first} />}</div>
            {rest.map((c) => (
              <InfoCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
