import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Accessible modal dialog: Esc closes, focus moves in and is restored, Tab is trapped. */
export function Modal({
  title,
  onClose,
  children,
  size = 'md',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));
    if (!node?.contains(document.activeElement)) focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-navy-950/70 px-4 py-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // my-auto: centred when it fits, top-aligned + scrollable when taller than the viewport (no clipped top edge)
          'my-auto w-full rounded-2xl bg-white p-6 shadow-card',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-2xl',
          size === 'lg' && 'max-w-4xl',
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center justify-center rounded-lg px-2 py-1 text-xl leading-none text-ink-500 hover:bg-surface-soft max-lg:min-h-11 max-lg:min-w-11"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
