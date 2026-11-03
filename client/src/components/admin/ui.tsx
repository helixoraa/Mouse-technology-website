import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-500/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-surface-soft';

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn(inputCls, 'resize-y', props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-press',
  secondary: 'border border-line bg-white text-ink hover:bg-surface-soft',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'text-brand hover:bg-brand/10',
};
export function Btn({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type={type}
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className,
      )}
    />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-pill transition-colors', checked ? 'bg-brand' : 'bg-line-dash')}
    >
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-line bg-white shadow-card', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-700">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label={label}>
      <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-lg font-bold text-ink">{title}</p>
      {text && <p className="max-w-md text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
      <p className="text-sm font-semibold text-danger">{message}</p>
      {onRetry && (
        <Btn variant="secondary" onClick={onRetry}>
          Try again
        </Btn>
      )}
    </div>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'success' | 'warn' | 'neutral' }) {
  const t = {
    brand: 'bg-brand/10 text-brand',
    success: 'bg-success-soft text-success',
    warn: 'bg-warn-soft text-warn',
    neutral: 'bg-surface-tint text-ink-700',
  }[tone];
  return <span className={cn('inline-flex rounded-pill px-2.5 py-1 text-xs font-bold', t)}>{children}</span>;
}
