import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  EMAIL_MAX,
  HONEYPOT_FIELD,
  LEAD_FIELDS,
  NAME_MAX,
  ORGANISATION_MAX,
  TOO_FAST_MESSAGE,
  leadSchema,
  submittedTooFast,
  type LeadField,
} from '@shared/validation';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';

interface FieldContent {
  label: string;
  placeholder: string;
}
export interface ContactFormContent {
  title?: string;
  fields?: {
    /** First/last name labels default to "First name"/"Last name" when the CMS has none. */
    firstName?: FieldContent;
    lastName?: FieldContent;
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

type Errors = Partial<Record<LeadField, string>>;

/** Element id per field, so a failed submit can move focus to the first field (in visual order) that needs fixing. */
const FIELD_IDS: Record<LeadField, string> = {
  firstName: 'cf-first-name',
  lastName: 'cf-last-name',
  email: 'cf-email',
  phone: 'cf-phone',
  organisation: 'cf-org',
  interest: 'cf-interest',
  message: 'cf-message',
  consent: 'cf-consent',
};

/** Field errors from a 400 response ({ details: { fieldErrors } }), first message per field. */
function serverFieldErrors(err: unknown): Errors {
  const fe =
    err instanceof ApiError ? (err.details as { fieldErrors?: Record<string, string[] | undefined> } | undefined)?.fieldErrors : undefined;
  const out: Errors = {};
  for (const key of LEAD_FIELDS) if (fe?.[key]?.[0]) out[key] = fe[key]![0];
  return out;
}

interface Props {
  content?: ContactFormContent;
  className?: string;
  /** "light" = white card (Home), "dark" = navy card (Contact frame). */
  variant?: 'light' | 'dark' | 'compact';
  /** Show the consent checkbox (Home form). The Contact frame has none; submitting the form then implies consent to be contacted. */
  showConsent?: boolean;
}

/**
 * Inquiry form: validated with the same zod schema as the API (@shared/validation), POSTs to /api/leads, shows loading /
 * error / success states. Reusable (Home + Contact). Bot protection: a hidden honeypot input and the time since the form appeared.
 */
export function ContactForm({ content, className, variant = 'light', showConsent = true }: Props) {
  const f = content?.fields ?? {};
  const dark = variant === 'dark';
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [consent, setConsent] = useState(false);
  const [loadedAt] = useState(() => Date.now());
  const interestOptions = f.interest?.options ?? [];

  // "compact" = the Home frame's inquiry form (Figma 1:… "Inquiry form", 600px card, 44px fields).
  const compact = variant === 'compact';
  const input = cn(
    'w-full border focus-visible:outline-brand-sky',
    dark
      ? 'rounded-2xl px-4 text-[15px]'
      : compact
        ? 'rounded-xl min-h-[44px] px-3.5 py-[12px] text-[13.5px]'
        : 'rounded-xl px-4 py-3.5 text-[15px]',
    dark
      ? 'border-white/20 bg-white/[0.04] text-white placeholder:text-mock-muted'
      : compact
        ? 'border-line bg-mock-field text-ink placeholder:text-ink-500 focus-visible:border-brand'
        : 'border-line bg-white text-ink placeholder:text-ink-500 focus-visible:border-brand',
  );
  const labelCls = cn(
    compact ? 'text-[12.5px] font-medium' : dark ? 'text-[13px] font-semibold leading-4' : 'text-xs font-semibold',
    dark ? 'text-mock-label' : compact ? 'text-mock-label2' : 'text-ink',
  );
  const card = cn(
    compact ? 'rounded-[30px] p-6 sm:p-[38px]' : dark ? 'rounded-xl4 p-6 md:p-12' : 'rounded-xl4 p-6 md:p-12',
    dark
      ? 'border border-line-form bg-navy-form text-white shadow-card'
      : compact
        ? 'border border-mock-fieldLine bg-white shadow-policy'
        : 'border border-line bg-white shadow-card',
    className,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const value = (k: string) => String(fd.get(k) ?? '');
    const showErrors = (next: Errors) => {
      setErrors(next);
      const first = LEAD_FIELDS.find((key) => next[key]);
      if (first) form.querySelector<HTMLElement>(`#${FIELD_IDS[first]}`)?.focus();
    };
    const parsed = leadSchema(interestOptions).safeParse({
      firstName: value('firstName'),
      lastName: value('lastName'),
      email: value('email'),
      phone: value('phone'),
      organisation: value('organisation'),
      interest: value('interest'),
      message: value('message'),
      consent: showConsent ? consent : true,
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as LeadField] ??= issue.message;
      return showErrors(next);
    }
    setErrors({});
    const elapsedMs = Date.now() - loadedAt;
    if (submittedTooFast(elapsedMs)) {
      setServerError(TOO_FAST_MESSAGE);
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const body = { ...parsed.data, elapsedMs, [HONEYPOT_FIELD]: value(HONEYPOT_FIELD) };
      await api('/leads', { method: 'POST', body: JSON.stringify(body) });
      setStatus('success');
    } catch (err) {
      const fieldErrors = serverFieldErrors(err);
      if (Object.keys(fieldErrors).length) {
        setStatus('idle');
        return showErrors(fieldErrors);
      }
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
  const textField = (key: LeadField, label: string, placeholder: string | undefined, attrs: InputHTMLAttributes<HTMLInputElement>) =>
    field(
      FIELD_IDS[key],
      label,
      errors[key],
      <input
        id={FIELD_IDS[key]}
        name={key}
        className={cn(input, dark && 'h-[54px]')}
        placeholder={placeholder}
        {...attrs}
        {...aria(FIELD_IDS[key], errors[key])}
      />,
    );

  return (
    <form noValidate onSubmit={onSubmit} className={cn(card, 'flex flex-col', compact ? 'gap-[18px]' : dark ? 'gap-6' : 'gap-5')}>
      {content?.title && (
        <h3
          className={cn(
            compact
              ? 'text-[26px] font-medium tracking-[-0.01em]'
              : dark
                ? 'mb-1 text-[28px] font-extrabold leading-[34px] tracking-[-0.01em]'
                : 'text-[28px] font-bold leading-tight',
            dark ? 'text-white' : 'text-ink',
          )}
        >
          {content.title}
        </h3>
      )}
      <div className={cn('grid md:grid-cols-2', compact ? 'gap-x-4 gap-y-[18px]' : dark ? 'gap-x-4 gap-y-6' : 'gap-5')}>
        {textField('firstName', f.firstName?.label ?? 'First name', f.firstName?.placeholder, {
          autoComplete: 'given-name',
          maxLength: NAME_MAX,
        })}
        {textField('lastName', f.lastName?.label ?? 'Last name', f.lastName?.placeholder, {
          autoComplete: 'family-name',
          maxLength: NAME_MAX,
        })}
        {textField('email', f.email?.label ?? 'Email', f.email?.placeholder, {
          type: 'email',
          autoComplete: 'email',
          maxLength: EMAIL_MAX,
        })}
        {textField('phone', f.phone?.label ?? 'Phone (optional)', f.phone?.placeholder, {
          type: 'tel',
          autoComplete: 'tel',
          inputMode: 'tel',
        })}
        {textField('organisation', f.organisation?.label ?? 'Organisation (optional)', f.organisation?.placeholder, {
          autoComplete: 'organization',
          maxLength: ORGANISATION_MAX,
        })}
        {field(
          FIELD_IDS.interest,
          f.interest?.label ?? 'Area of interest',
          errors.interest,
          <Select
            id={FIELD_IDS.interest}
            name="interest"
            options={interestOptions}
            placeholder={f.interest?.placeholder ?? 'Select an area'}
            triggerClassName={cn(input, 'focus-visible:outline-brand-sky', dark ? 'h-[54px]' : '')}
            placeholderClassName={dark ? 'text-mock-muted' : 'text-ink-500'}
            listClassName={dark ? 'border-white/20 bg-navy-form text-white' : 'border-line bg-white text-ink'}
            chevron={dark ? <span className="text-base text-mock-muted">⌄</span> : undefined}
            {...aria(FIELD_IDS.interest, errors.interest)}
          />,
        )}
      </div>
      {/* Honeypot: hidden from people and assistive tech; a value here means a bot filled the form. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="cf-website">Leave this field empty</label>
        <input id="cf-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      {field(
        'cf-message',
        f.message?.label ?? 'Message',
        errors.message,
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          className={cn(input, compact ? 'h-[110px] resize-none' : dark ? 'h-[150px] resize-none py-4' : 'min-h-[148px]')}
          placeholder={f.message?.placeholder}
          {...aria('cf-message', errors.message)}
        />,
      )}
      {showConsent && (
        <div className="flex flex-col gap-2">
          <Checkbox
            id="cf-consent"
            checked={consent}
            onChange={setConsent}
            invalid={!!errors.consent}
            className={cn(
              compact ? 'text-xs text-mock-consent' : 'items-start text-[13.5px] leading-5',
              !compact && (dark ? 'text-text-muted' : 'text-ink-700'),
            )}
          >
            {content?.consent ?? 'I agree to the Privacy Policy and consent to MAOUAJ Technology contacting me.'}
          </Checkbox>
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
          'inline-flex items-center gap-2.5 transition-colors disabled:opacity-60',
          compact
            ? 'h-[52px] w-full justify-center rounded-[14px] bg-send font-semibold text-white hover:opacity-90 active:opacity-80'
            : cn(
                dark
                  ? '-mt-0.5 h-[52px] self-start rounded-pill px-7 text-[14.5px] font-semibold'
                  : 'self-start rounded-pill px-7 py-[17px] text-[15px] font-bold',
                dark
                  ? 'bg-white text-ink hover:bg-surface-tint active:bg-line'
                  : 'bg-brand text-white hover:bg-brand-indigo active:bg-brand-navy',
              ),
        )}
      >
        {status === 'loading' ? 'Sending…' : (content?.submit ?? 'Send inquiry')}
        {dark && status !== 'loading' && (
          <span aria-hidden className="text-sm font-bold">
            →
          </span>
        )}
      </button>
    </form>
  );
}

export default ContactForm;
