import type { Segment } from '@/lib/types';
import { mediaUrl, retinaSrcSet } from '@/lib/api';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InnerBand } from '../InnerBand';

export interface LeadershipContent {
  header: { title: Segment[]; subtitle: string; description?: string };
  image: string;
  /** 2x version of `image` (srcset). */
  image2x?: string;
  /** The photo's own size: when set, the whole photo is shown in its own shape (no crop) with the name/title below. */
  imageWidth?: number;
  imageHeight?: number;
  imageAlt: string;
  /** The person in the photo, shown below it like the team cards. */
  name?: string;
  title?: string;
  paragraphs: string[];
}

export function Leadership({ content }: { content: LeadershipContent }) {
  const [lead, ...rest] = content.paragraphs;
  const src = mediaUrl(content.image);
  const srcSet = content.image2x ? `${src} 1x, ${mediaUrl(content.image2x)} 2x` : retinaSrcSet(src);
  const portrait = !!(content.imageWidth && content.imageHeight);
  return (
    <InnerBand tone="soft">
      <SectionHeader {...content.header} />
      <div className="flex flex-col items-center gap-10 lg:grid lg:grid-cols-[minmax(0,552fr)_minmax(0,648fr)] lg:gap-24">
        {portrait ? (
          // The whole photo in its own shape (no crop), the person's name and title below it.
          <figure className="flex w-full max-w-[552px] flex-col items-center gap-5 lg:max-w-[400px] lg:justify-self-start">
            <img
              src={src}
              srcSet={srcSet}
              alt={content.imageAlt}
              width={content.imageWidth}
              height={content.imageHeight}
              className="h-auto w-full rounded-xl4 border border-white/25"
            />
            {content.name && (
              <figcaption className="flex w-full flex-col items-center gap-1.5 text-center">
                <span className="text-[22px] font-bold text-ink">{content.name}</span>
                {content.title && <span className="text-sm font-semibold text-brand">{content.title}</span>}
              </figcaption>
            )}
          </figure>
        ) : (
          <img
            src={src}
            srcSet={srcSet}
            alt={content.imageAlt}
            width={552}
            height={451}
            className="aspect-[552/451] h-auto w-full max-w-[552px] rounded-xl4 border border-white/25 object-cover lg:max-w-none"
          />
        )}
        <div className="flex min-w-0 flex-col gap-6 text-xl text-ink">
          <p className="font-medium leading-[30px]">{lead}</p>
          {rest.map((p) => (
            <p key={p} className="font-normal leading-[27px]">
              {p}
            </p>
          ))}
        </div>
      </div>
    </InnerBand>
  );
}
