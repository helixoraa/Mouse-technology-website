import type { Segment } from '@/lib/types';

/** Renders a heading made of plain + accent-coloured segments. */
export function Segments({
  parts,
  accentClass = 'text-brand',
  baseClass = '',
}: {
  parts: Segment[] | string | undefined;
  accentClass?: string;
  baseClass?: string;
}) {
  if (!parts) return null;
  if (typeof parts === 'string') return <span className={baseClass}>{parts}</span>;
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={p.accent ? accentClass : baseClass}>
          {p.text}
        </span>
      ))}
    </>
  );
}
