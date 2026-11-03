import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import arrow from '@/assets/svg/arrow.svg';

type Variant = 'primary' | 'white' | 'glass';
const styles: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-press',
  white: 'bg-white text-ink hover:bg-surface-tint',
  glass: 'border border-white/40 bg-white/10 text-text-onDark hover:bg-white/20',
};

type Props = { to?: string; variant?: Variant; withArrow?: boolean; children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ to, variant = 'primary', withArrow, children, className, ...rest }: Props) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2.5 rounded-pill px-7 py-[17px] text-[15px] font-bold transition-colors disabled:opacity-60',
    styles[variant],
    className,
  );
  const content = (
    <>
      {children}
      {withArrow && <img src={arrow} alt="" className="size-4" />}
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {content}
    </button>
  );
}
