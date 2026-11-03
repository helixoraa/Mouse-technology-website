import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps {
  id: string;
  name: string;
  options: string[];
  placeholder: string;
  /** Styles for the closed trigger (size, border, background, text). */
  triggerClassName?: string;
  /** Styles for the popup list. */
  listClassName?: string;
  /** Classes applied to each option (hover/selected handled by data attributes). */
  optionClassName?: string;
  placeholderClassName?: string;
  chevron?: React.ReactNode;
}

/** Fully custom, keyboard-accessible listbox select (no native <select>). Submits its value via a hidden input. */
export function Select({
  id,
  name,
  options,
  placeholder,
  triggerClassName,
  listClassName,
  optionClassName,
  placeholderClassName = 'opacity-70',
  chevron,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (i: number) => {
    setValue(options[i] ?? '');
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(Math.max(0, options.indexOf(value)));
        } else setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) setOpen(true);
        else setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) choose(active);
        else {
          setOpen(true);
          setActive(Math.max(0, options.indexOf(value)));
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => {
          setOpen((o) => !o);
          setActive(Math.max(0, options.indexOf(value)));
        }}
        onKeyDown={onKeyDown}
        className={cn('flex w-full items-center justify-between text-left', triggerClassName)}
      >
        <span className={cn('truncate', !value && placeholderClassName)}>{value || placeholder}</span>
        <span aria-hidden className={cn('ml-3 shrink-0 transition-transform', open && 'rotate-180')}>
          {chevron ?? (
            <svg
              viewBox="0 0 12 8"
              className="h-2 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1.5 1.75 6 6.25l4.5-4.5" />
            </svg>
          )}
        </span>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className={cn(
            'absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-2xl border p-1.5 shadow-card',
            listClassName,
          )}
        >
          {options.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={value === o}
              data-active={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={cn(
                'cursor-pointer flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm data-[active=true]:bg-brand/15',
                value === o && 'font-semibold',
                optionClassName,
              )}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Select;
