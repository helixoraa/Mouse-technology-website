import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { Btn, Field, TextInput } from '@/components/admin/ui';
import { PasswordStrength } from '@/components/admin/SecurityBits';
import { errMsg, isLockout, type LoginResponse } from '@/lib/admin-api';
import { api, ApiError } from '@/lib/api';
import { isStrongPassword } from '@/lib/password';
import type { User } from '@/lib/types';

const PRE_AUTH_TTL_MS = 5 * 60 * 1000;
const LOCKOUT_MSG = 'Too many attempts. This account is locked, please try again in 15 minutes.';

type Step = { name: 'credentials' } | { name: 'change-password' };

const credsSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

function StepShell({
  title,
  intro,
  children,
  headingRef,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold text-ink outline-none">
        {title}
      </h1>
      {intro && <div className="mb-6 mt-1 text-sm text-ink-700">{intro}</div>}
      {children}
    </>
  );
}

function ErrorLine({ id, message }: { id?: string; message: string }) {
  return (
    <p id={id} role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}

/**
 * Sign in: credentials -> session, with a forced new password first when signing in with a temporary password.
 * The pre-auth token only lives in this component's memory (never storage) and expires after 5 minutes.
 */
export function LoginFlow({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const [step, setStep] = useState<Step>({ name: 'credentials' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<{ token: string; at: number } | null>(null);
  const passwordRef = useRef(''); // kept in memory only, to flag temp-password reuse; cleared on reset
  const headingRef = useRef<HTMLHeadingElement>(null);

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const reset = useCallback((message?: string) => {
    tokenRef.current = null;
    passwordRef.current = '';
    setStep({ name: 'credentials' });
    setPassword('');
    setNewPw('');
    setConfirmPw('');
    setError('');
    setNotice(message ?? '');
  }, []);

  // 5-minute pre-auth expiry (also re-checked on every request)
  useEffect(() => {
    if (step.name === 'credentials') return;
    const left = tokenRef.current ? PRE_AUTH_TTL_MS - (Date.now() - tokenRef.current.at) : 0;
    const t = setTimeout(() => reset('Your sign-in session expired. Please start again.'), Math.max(left, 0));
    return () => clearTimeout(t);
  }, [step, reset]);

  // move focus to the new step heading
  useEffect(() => {
    headingRef.current?.focus();
  }, [step.name]);

  const handleError = (e: unknown) => {
    if (isLockout(e)) return setError(LOCKOUT_MSG);
    if (e instanceof ApiError && e.status === 401 && step.name !== 'credentials' && /expired|pre-?auth|token|session/i.test(e.message)) {
      return reset('Your sign-in session expired. Please start again.');
    }
    setError(errMsg(e));
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const token = () => {
    const t = tokenRef.current;
    if (!t || Date.now() - t.at > PRE_AUTH_TTL_MS) throw new ApiError(401, 'Your pre-auth session expired');
    return t.token;
  };

  const submitCreds = (e: FormEvent) => {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    void run(async () => {
      const r = await api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if ('user' in r) return onSignedIn(r.user);
      tokenRef.current = { token: r.preAuthToken, at: Date.now() };
      passwordRef.current = password;
      setPassword('');
      setStep({ name: 'change-password' });
    });
  };

  const submitNewPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!isStrongPassword(newPw)) return setError('Choose a stronger password that meets every rule below.');
    if (newPw !== confirmPw) return setError('The two passwords do not match.');
    if (newPw === passwordRef.current) return setError('Your new password must be different from the temporary password.');
    const local = email.split('@')[0].toLowerCase();
    if (local.length >= 3 && newPw.toLowerCase().includes(local)) return setError('Do not include your email name in your password.');
    void run(async () => {
      const r = await api<{ user: User }>('/auth/pre/change-password', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken: token(), newPassword: newPw }),
      });
      tokenRef.current = null;
      passwordRef.current = '';
      onSignedIn(r.user);
    });
  };

  const backBtn = (
    <button
      type="button"
      onClick={() => reset()}
      className="mt-4 w-full text-center text-sm font-semibold text-brand hover:underline max-lg:min-h-11"
    >
      ← Back to sign in
    </button>
  );

  return (
    <div aria-busy={busy}>
      {notice && (
        <p role="status" className="mb-4 rounded-xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn">
          {notice}
        </p>
      )}

      {step.name === 'credentials' && (
        <StepShell title="Admin sign in" intro="Manage website content, leads and settings." headingRef={headingRef}>
          <form onSubmit={submitCreds} noValidate className="space-y-4">
            <Field label="Email">
              <TextInput type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </Field>
            <Field label="Password">
              <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <ErrorLine message={error} />}
            <Btn type="submit" className="w-full" disabled={busy}>
              {busy ? 'Checking…' : 'Continue'}
            </Btn>
          </form>
        </StepShell>
      )}

      {step.name === 'change-password' && (
        <StepShell
          title="Choose a new password"
          intro="You signed in with a temporary password. Set your own password to continue."
          headingRef={headingRef}
        >
          <form onSubmit={submitNewPassword} noValidate className="space-y-4">
            <input type="text" autoComplete="username" value={email} readOnly hidden aria-hidden />
            <div>
              <Field label="New password">
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  aria-describedby="pw-rules"
                  autoFocus
                />
              </Field>
              <div id="pw-rules">
                <PasswordStrength value={newPw} />
              </div>
              {newPw && newPw === passwordRef.current && (
                <p className="mt-1 text-xs font-semibold text-danger">Must be different from your temporary password.</p>
              )}
            </div>
            <Field label="Confirm new password">
              <TextInput type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </Field>
            {error && <ErrorLine message={error} />}
            <Btn type="submit" className="w-full" disabled={busy}>
              {busy ? 'Saving…' : 'Save password and continue'}
            </Btn>
          </form>
          {backBtn}
        </StepShell>
      )}
    </div>
  );
}
