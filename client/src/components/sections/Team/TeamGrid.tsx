import type { CSSProperties } from 'react';
import type { Segment, TeamMember } from '@/lib/types';
import { mediaUrl } from '@/lib/api';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { InnerBand } from '../InnerBand';

export interface TeamGridContent {
  header: { title: Segment[]; subtitle: string; description: string };
  /** Left over from the former carousel; still present in stored content, no longer rendered. */
  prevLabel?: string;
  nextLabel?: string;
}

/**
 * Column count for `count` cards that leaves no partial last row when one of `options` divides the count,
 * otherwise the fullest last row; ties go to the wider row. Never more columns than cards.
 */
export function balancedColumns(count: number, options: number[]): number {
  const fits = options.filter((c) => c <= count);
  if (count <= 0 || fits.length === 0) return Math.max(1, Math.min(count, ...options));
  const empty = (c: number) => (c - (count % c)) % c;
  return fits.reduce((best, c) => (empty(c) < empty(best) || (empty(c) === empty(best) && c > best) ? c : best));
}

function MemberCard({ m }: { m: TeamMember }) {
  const vector = m.photo?.endsWith('.svg');
  return (
    <li className="flex flex-col items-center gap-5">
      {/* One frame ratio for every photo (288:336, the design card). Raster portraits are pre-cut arches drawn
          288:296 from 24/336 down the frame; vector placeholders fill the whole frame. */}
      <div className="relative aspect-[288/336] w-full overflow-hidden">
        {m.photo ? (
          <img
            src={mediaUrl(m.photo)}
            alt={`Portrait placeholder for ${m.name}`}
            className={
              vector
                ? 'absolute inset-0 size-full object-cover'
                : 'absolute inset-x-0 top-[calc(100%*24/336)] aspect-[288/296] w-full object-cover'
            }
            loading="lazy"
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

/**
 * Every team member visible at once. Cards are at most a fifth of the content width (slightly smaller than the
 * design's 288px card) and the grid is centred. Columns: 1 (<640), 2 (640-767), 2-3 (768-1023), and from 1024 a
 * single row for up to five members, otherwise a balanced 3-5 column grid.
 */
export function TeamGrid({ content, members }: { content: TeamGridContent; members: TeamMember[] }) {
  const n = members.length;
  const vars = {
    '--team-cols-sm': balancedColumns(n, [2, 1]),
    '--team-cols-md': balancedColumns(n, [3, 2]),
    '--team-cols-lg': n <= 5 ? Math.max(n, 1) : balancedColumns(n, [5, 4, 3]),
  } as CSSProperties;

  return (
    <InnerBand tone="white" className="gap-10 xl:gap-16">
      <SectionHeader {...content.header} />
      <ul
        aria-label="Team members"
        style={vars}
        className="grid grid-cols-[minmax(0,var(--team-card))] justify-center gap-x-6 gap-y-12 [--team-card:calc((theme(maxWidth.page)-4*theme(spacing.6))/5)] sm:grid-cols-[repeat(var(--team-cols-sm),minmax(0,var(--team-card)))] md:grid-cols-[repeat(var(--team-cols-md),minmax(0,var(--team-card)))] lg:grid-cols-[repeat(var(--team-cols-lg),minmax(0,var(--team-card)))]"
      >
        {members.map((m) => (
          <MemberCard key={m.id} m={m} />
        ))}
      </ul>
    </InnerBand>
  );
}
