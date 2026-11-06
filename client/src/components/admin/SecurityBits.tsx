import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { passwordRules, passwordScore, strengthLabels } from '@/lib/password';
import { Btn } from './ui';

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
