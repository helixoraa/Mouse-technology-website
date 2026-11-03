import { useEffect, useId, useRef, useState, type ClipboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { passwordRules, passwordScore, strengthLabels } from '@/lib/password';
import { Btn, inputCls } from './ui';

/** Copies text; falls back to a hidden textarea when the async clipboard API is unavailable (plain http, old browsers). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 2200);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <Btn
      variant="secondary"
      size="sm"
      className={className}
      onClick={async () => setState((await copyText(text)) ? 'done' : 'fail')}
      aria-live="polite"
    >
      {state === 'done' ? 'Copied ✓' : state === 'fail' ? 'Copy failed: select manually' : label}
    </Btn>
  );
}

/** Live strength bar + rule checklist for a new password. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const rules = passwordRules(value);
  const colors = ['bg-line', 'bg-danger', 'bg-warn', 'bg-brand', 'bg-success'];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-pill', i <= score ? colors[score] : 'bg-line')} />
          ))}
        </div>
        <span className="w-14 text-right text-xs font-bold text-ink-700">{value ? strengthLabels[score] : ''}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {rules.map((r) => (
          <li key={r.id} className={cn('flex items-start gap-2 text-xs', r.ok ? 'text-success' : 'text-ink-500')}>
            <span aria-hidden className="mt-px font-bold">
              {r.ok ? '✓' : '○'}
            </span>
            <span>
              {r.label}
              <span className="sr-only">{r.ok ? ' (met)' : ' (not met yet)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Six-digit one-time code field: numeric keypad, one-time-code autofill, paste support (strips spaces/dashes),
 * auto-submits via onComplete the moment six digits are present.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  label = 'Authentication code',
  autoFocus,
  describedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  const apply = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    if (digits.length === 6) onComplete?.(digits);
  };
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-700">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder="000000"
        aria-describedby={describedBy}
        onChange={(e) => apply(e.target.value)}
        onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
          e.preventDefault();
          apply(e.clipboardData.getData('text'));
        }}
        className={cn(inputCls, 'text-center font-mono text-2xl font-bold tracking-[0.5em] max-lg:min-h-14')}
      />
    </div>
  );
}

/** One-time backup codes: copy all, download .txt, and a required "I saved these" confirmation owned by the parent. */
export function BackupCodes({ codes, filename = 'maouaj-backup-codes.txt' }: { codes: string[]; filename?: string }) {
  const all = codes.join('\n');
  const download = () => {
    const blob = new Blob([`MAOUAJ admin backup codes\nEach code works once. Keep them somewhere safe.\n\n${all}\n`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-soft p-4" aria-label="Backup codes">
        {codes.map((c) => (
          <li key={c} className="rounded-lg bg-white px-3 py-2 text-center font-mono text-sm font-bold tracking-wider text-ink">
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={all} label="Copy all" />
        <Btn variant="secondary" size="sm" onClick={download}>
          Download .txt
        </Btn>
      </div>
    </div>
  );
}
