import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  boxClassName?: string;
}

/**
 * Custom checkbox: a styled `role="checkbox"` button (no native control), toggled by click, Space or Enter.
 * Below xl the button grows to a 44x44 touch target (negative margins keep the visual box where it was).
 */
export function Checkbox({ id, checked, onChange, children, invalid, describedBy, className, boxClassName }: CheckboxProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => onChange(!checked)}
        className="group flex shrink-0 items-center justify-center rounded-lg max-xl:-m-[13px] max-xl:size-11"
      >
        <span
          className={cn(
            'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
            checked ? 'border-brand bg-brand' : 'border-mock-fieldLine bg-white',
            invalid && !checked && 'border-danger',
            boxClassName,
          )}
        >
          {checked && (
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="size-3 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 6.2 5 8.7l4.5-5" />
            </svg>
          )}
        </span>
      </button>
      <label htmlFor={id} className="cursor-pointer max-xl:flex max-xl:min-h-11 max-xl:items-center">
        {children}
      </label>
    </div>
  );
}

export default Checkbox;
