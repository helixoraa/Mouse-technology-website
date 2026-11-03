import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Full-bleed content band used by the inner pages (Figma: 72px gutters, 110px vertical padding, 56px gap). */
export function InnerBand({
  tone = 'soft',
  children,
  className,
  id,
  labelledBy,
}: {
  tone?: 'soft' | 'white';
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        tone === 'soft' ? 'bg-surface-soft' : 'bg-white',
        'px-5 py-16 leading-[normal] md:px-10 md:py-24 xl:px-gutter xl:py-[110px]',
      )}
    >
      <div className={cn('mx-auto flex max-w-page flex-col gap-10 xl:gap-14', className)}>{children}</div>
    </section>
  );
}
