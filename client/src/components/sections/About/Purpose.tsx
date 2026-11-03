import { InnerBand } from '../InnerBand';

export interface PurposeContent {
  eyebrow: string;
  title: string;
  tags: string[];
}

export function Purpose({ content }: { content: PurposeContent }) {
  return (
    <InnerBand tone="soft">
      <div className="flex flex-col gap-7 overflow-hidden rounded-xl4 border border-white/25 bg-purpose-card p-8 md:p-16">
        <p className="text-base font-bold uppercase tracking-[0.16em] text-text-soft md:text-xl">{content.eyebrow}</p>
        <h2 className="max-w-[880px] text-[30px] font-extrabold leading-9 tracking-[-0.02em] text-white md:text-5xl md:leading-[58px]">
          {content.title}
        </h2>
        <ul className="flex flex-wrap gap-3">
          {content.tags.map((t) => (
            <li
              key={t}
              className="rounded-pill border border-white/45 bg-white/10 px-[22px] py-3 text-[14.5px] font-semibold text-text-onDark"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </InnerBand>
  );
}
