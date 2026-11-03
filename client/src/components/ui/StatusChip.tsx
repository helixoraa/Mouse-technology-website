import { cn } from '@/lib/cn';

/** Pill chip. "Planned" is neutral grey-blue; anything else is brand blue (Figma: In development / Existing business). */
export function StatusChip({ label, tone, className }: { label: string; tone?: 'brand' | 'neutral'; className?: string }) {
  const t = tone ?? (label.toLowerCase() === 'planned' ? 'neutral' : 'brand');
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-pill border px-3 py-1.5 text-xs font-semibold',
        t === 'brand' ? 'border-brand/40 bg-brand/10 text-brand' : 'border-line-chip bg-line-chipBg text-ink-700',
        className,
      )}
    >
      {label}
    </span>
  );
}
