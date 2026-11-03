import { useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface FieldContent {
  label: string;
  placeholder: string;
}
export interface ContactFormContent {
  title?: string;
  fields?: {
    name?: FieldContent;
    email?: FieldContent;
    phone?: FieldContent;
    organisation?: FieldContent;
    interest?: FieldContent & { options: string[] };
    message?: FieldContent;
  };
  consent?: string;
  submit?: string;
  successTitle?: string;
  successText?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().max(40).optional(),
  organisation: z.string().trim().max(120).optional(),
  interest: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Please tell us a little more (at least 10 characters)').max(4000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please agree to continue' }) }),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

interface Props {
  content?: ContactFormContent;
  className?: string;
  /** "light" = white card (Home), "dark" = navy card (Contact frame). */
  variant?: 'light' | 'dark' | 'compact';
  /** Show the consent checkbox (Home form). The Contact frame has none; submitting the form then implies consent to be contacted. */
  showConsent?: boolean;
}

/** Inquiry form: zod-validated, POSTs to /api/leads, shows loading / error / success states. Reusable (Home + Contact). */
export function ContactForm({ content, className, variant = 'light', showConsent = true }: Props) {
  const f = content?.fields ?? {};
  const dark = variant === 'dark';
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  // "compact" = the Home frame's inquiry form (Figma 1:… "Inquiry form", 600px card, 44px fields).
  const compact = variant === 'compact';
  const input = cn(
    'w-full rounded-xl border focus-visible:outline-brand-sky',
    compact ? 'min-h-[44px] px-3.5 py-[12px] text-[13.5px]' : 'px-4 py-3.5 text-[15px]',
    dark
      ? 'border-white/15 bg-white/[0.07] text-white placeholder:text-text-muted/70'
      : compact
        ? 'border-line bg-mock-field text-ink placeholder:text-mock-placeholder focus-visible:border-brand'
        : 'border-line bg-white text-ink placeholder:text-ink-500/70 focus-visible:border-brand',
  );
  const labelCls = cn(
    compact ? 'text-[12.5px] font-medium' : 'text-xs font-semibold',
    dark ? 'text-text-onDark' : compact ? 'text-mock-label2' : 'text-ink',
  );
  const card = cn(
    compact ? 'rounded-[30px] p-6 sm:p-[38px]' : 'rounded-xl4 p-6 md:p-12',
    dark
      ? 'bg-ink text-white'
      : compact
        ? 'border border-mock-fieldLine bg-white shadow-policy'
        : 'border border-line bg-white shadow-card',
    className,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? '') || undefined,
      organisation: String(fd.get('organisation') ?? '') || undefined,
      interest: String(fd.get('interest') ?? '') || undefined,
      message: String(fd.get('message') ?? ''),
      consent: showConsent ? fd.get('consent') === 'on' : true,
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus('loading');
    try {
      await api('/leads', { method: 'POST', body: JSON.stringify(parsed.data) });
      setStatus('success');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className={cn(card, 'flex flex-col gap-3')}>
        <h3 className={cn('text-h-card font-extrabold', dark ? 'text-white' : 'text-ink')}>{content?.successTitle ?? 'Thank you'}</h3>
        <p className={cn('text-body-sm', dark ? 'text-text-muted' : 'text-ink-500')}>
          {content?.successText ?? 'Your inquiry has been sent. We will be in touch soon.'}
        </p>
      </div>
    );
  }

  const field = (id: string, label: string, error: string | undefined, control: ReactNode) => (
    <div className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-2')}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
  const aria = (id: string, err?: string) => ({ 'aria-invalid': !!err, 'aria-describedby': err ? `${id}-error` : undefined });

  return (
    <form noValidate onSubmit={onSubmit} className={cn(card, 'flex flex-col', compact ? 'gap-[18px]' : 'gap-5')}>
      {content?.title && (
        <h3
          className={cn(
            compact ? 'text-[26px] font-medium tracking-[-0.01em]' : 'text-[28px] font-bold leading-tight',
            dark ? 'text-white' : 'text-ink',
          )}
        >
          {content.title}
        </h3>
      )}
      <div className={cn('grid md:grid-cols-2', compact ? 'gap-x-4 gap-y-[18px]' : 'gap-5')}>
        {field(
          'cf-name',
          f.name?.label ?? 'Full name',
          errors.name,
          <input
            id="cf-name"
            name="name"
            autoComplete="name"
            className={input}
            placeholder={f.name?.placeholder}
            {...aria('cf-name', errors.name)}
          />,
        )}
        {field(
          'cf-email',
          f.email?.label ?? 'Email',
          errors.email,
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            className={input}
            placeholder={f.email?.placeholder}
            {...aria('cf-email', errors.email)}
          />,
        )}
        {field(
          'cf-phone',
          f.phone?.label ?? 'Phone (optional)',
          undefined,
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className={input} placeholder={f.phone?.placeholder} />,
        )}
        {field(
          'cf-org',
          f.organisation?.label ?? 'Organisation (optional)',
          undefined,
          <input id="cf-org" name="organisation" autoComplete="organization" className={input} placeholder={f.organisation?.placeholder} />,
        )}
      </div>
      {field(
        'cf-interest',
        f.interest?.label ?? 'Area of interest',
        undefined,
        <select id="cf-interest" name="interest" defaultValue="" className={input}>
          <option value="" className="text-ink">
            {f.interest?.placeholder ?? 'Select an area'}
          </option>
          {(f.interest?.options ?? []).map((o) => (
            <option key={o} value={o} className="text-ink">
              {o}
            </option>
          ))}
        </select>,
      )}
      {field(
        'cf-message',
        f.message?.label ?? 'Message',
        errors.message,
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          className={cn(input, compact ? 'h-[110px] resize-none' : 'min-h-[148px]')}
          placeholder={f.message?.placeholder}
          {...aria('cf-message', errors.message)}
        />,
      )}
      {showConsent && (
        <div className="flex flex-col gap-2">
          <label
            className={cn(
              'flex items-start gap-3',
              compact ? 'items-center gap-2.5 text-xs text-mock-consent' : 'text-[13.5px] leading-5',
              !compact && (dark ? 'text-text-muted' : 'text-ink-700'),
            )}
          >
            <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-brand" aria-invalid={!!errors.consent} />
            <span>{content?.consent ?? 'I agree to the Privacy Policy and consent to MAOUAJ Technology contacting me.'}</span>
          </label>
          {errors.consent && (
            <p role="alert" className="text-xs font-medium text-danger">
              {errors.consent}
            </p>
          )}
        </div>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm font-medium text-danger">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className={cn(
          'inline-flex items-center gap-2.5 text-[15px] transition-colors disabled:opacity-60',
          compact
            ? 'h-[52px] w-full justify-center rounded-[14px] bg-send font-semibold text-white hover:opacity-90'
            : cn(
                'self-start rounded-pill px-7 py-[17px] font-bold',
                dark ? 'bg-white text-ink hover:bg-surface-tint' : 'bg-brand text-white hover:bg-brand-press',
              ),
        )}
      >
        {status === 'loading' ? 'Sending…' : (content?.submit ?? 'Send inquiry')}
        {dark && status !== 'loading' && <span aria-hidden>→</span>}
      </button>
    </form>
  );
}

export default ContactForm;
