import { Link } from 'react-router-dom';
import type { Segment, Service } from '@/lib/types';
import { mediaUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { InnerBand } from '../InnerBand';

export interface ProjectGroupContent {
  header: { title: Segment[]; subtitle: string; description: string };
}

function ProjectCard({ s, large }: { s: Service; large: boolean }) {
  return (
    <li
      className={cn(
        'flex flex-col gap-5 overflow-hidden border border-line bg-white shadow-card',
        large ? 'rounded-xl3 p-6 md:p-11' : 'rounded-xl2 p-6 md:p-7',
      )}
    >
      <div
        className="h-[220px] w-full shrink-0 overflow-hidden rounded-[20px]"
        style={s.gradient ? { backgroundImage: s.gradient } : undefined}
      >
        {s.image && <img src={mediaUrl(s.image)} alt={`${s.title} illustration`} className="size-full object-cover" loading="lazy" />}
      </div>
      <div>
        <StatusChip label={s.status} />
      </div>
      <h3 className={cn('font-extrabold text-ink', large ? 'text-h-card-lg' : 'text-h-card')}>{s.title}</h3>
      <p className="text-body-sm text-ink-500">{s.summary}</p>
      <Link to={s.ctaHref || '/our-products'} className="flex w-fit items-center gap-2 font-semibold text-brand">
        <span className="text-[14.5px]">{s.ctaLabel || 'Learn more'}</span>
        <span aria-hidden className="text-[15px]">
          →
        </span>
        <span className="sr-only"> about {s.title}</span>
      </Link>
    </li>
  );
}

export function ProjectGroup({
  content,
  services,
  tone,
  large,
}: {
  content: ProjectGroupContent;
  services: Service[];
  tone: 'soft' | 'white';
  large?: boolean;
}) {
  return (
    <InnerBand tone={tone}>
      <SectionHeader {...content.header} />
      <ul className="grid gap-6 md:grid-cols-2">
        {services.map((s) => (
          <ProjectCard key={s.id} s={s} large={!!large} />
        ))}
      </ul>
    </InnerBand>
  );
}
