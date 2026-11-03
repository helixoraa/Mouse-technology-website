import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';
import { Btn, Field, TextInput } from '@/components/admin/ui';
import { BackupCodes, CodeInput, CopyButton, PasswordStrength } from '@/components/admin/SecurityBits';
import { errMsg, isLockout, type PreAuthNext, type PreAuthResponse, type TwoFaSetup } from '@/lib/admin-api';
import { api, ApiError } from '@/lib/api';
import { isStrongPassword } from '@/lib/password';
import type { User } from '@/lib/types';

const PRE_AUTH_TTL_MS = 5 * 60 * 1000;
const LOCKOUT_MSG = 'Too many attempts. This account is locked, please try again in 15 minutes.';

type Step =
  | { name: 'credentials' }
  | { name: 'change-password' }
  | { name: 'setup'; setup: TwoFaSetup }
  | { name: 'backup'; codes: string[]; user: User }
  | { name: 'code'; backup: boolean };

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
 * Multi-step sign in: credentials -> (forced new password) -> (forced 2FA setup + backup codes) | 2FA code -> session.
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
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [saved, setSaved] = useState(false);

  const reset = useCallback((message?: string) => {
    tokenRef.current = null;
    passwordRef.current = '';
    setStep({ name: 'credentials' });
    setPassword('');
    setNewPw('');
    setConfirmPw('');
    setCode('');
    setBackupCode('');
    setSaved(false);
    setError('');
    setNotice(message ?? '');
  }, []);

  // 5-minute pre-auth expiry (also re-checked on every request)
  useEffect(() => {
    if (step.name === 'credentials' || step.name === 'backup') return;
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

  const goNext = async (r: PreAuthResponse) => {
    tokenRef.current = { token: r.preAuthToken, at: Date.now() };
    const next: PreAuthNext = r.next;
    setCode('');
    setBackupCode('');
    if (next === 'change-password') setStep({ name: 'change-password' });
    else if (next === 'setup-2fa') {
      const setup = await api<TwoFaSetup>('/auth/pre/2fa/setup', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken: tokenRef.current.token }),
      });
      setStep({ name: 'setup', setup });
    } else setStep({ name: 'code', backup: false });
  };

  const submitCreds = (e: FormEvent) => {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    void run(async () => {
      const r = await api<PreAuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      passwordRef.current = password;
      setPassword('');
      await goNext(r);
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
      const r = await api<PreAuthResponse>('/auth/pre/change-password', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken: token(), newPassword: newPw }),
      });
      passwordRef.current = '';
      setNewPw('');
      setConfirmPw('');
      await goNext(r);
    });
  };

  const enable2fa = (value: string) => {
    if (busy) return;
    void run(async () => {
      const r = await api<{ user: User; backupCodes: string[] }>('/auth/pre/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ preAuthToken: token(), code: value }),
      });
      tokenRef.current = null;
      setCode('');
      setSaved(false);
      setStep({ name: 'backup', codes: r.backupCodes, user: r.user });
    });
  };

  const verify = (payload: { code: string } | { backupCode: string }) => {
    if (busy) return;
    void run(async () => {
      try {
        const r = await api<{ user: User }>('/auth/pre/verify', {
          method: 'POST',
          body: JSON.stringify({ preAuthToken: token(), ...payload }),
        });
        tokenRef.current = null;
        onSignedIn(r.user);
      } catch (e) {
        setCode('');
        throw e;
      }
    });
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    if (step.name === 'setup') return code.length === 6 ? enable2fa(code) : setError('Enter the 6-digit code from your authenticator app.');
    if (step.name !== 'code') return;
    if (step.backup) {
      const v = backupCode.trim();
      if (v.length < 6) return setError('Enter one of your backup codes.');
      return verify({ backupCode: v });
    }
    if (code.length !== 6) return setError('Enter the 6-digit code from your authenticator app.');
    verify({ code });
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
          intro="You signed in with a temporary password. Set your own password to continue. You will be asked for a 2FA code next."
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

      {step.name === 'setup' && (
        <StepShell
          title="Set up two-factor authentication"
          intro="Two-factor authentication is required for every account. Scan the QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code it shows."
          headingRef={headingRef}
        >
          <form onSubmit={submitCode} noValidate className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-soft p-4">
              <img
                src={step.setup.qrDataUrl}
                alt="QR code to add MAOUAJ admin to your authenticator app"
                width={200}
                height={200}
                className="size-[200px] rounded-lg bg-white p-2"
              />
              <div className="w-full text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Can’t scan? Enter this key manually</p>
                <p className="mt-1 break-all font-mono text-sm font-bold text-ink">{step.setup.manualKey}</p>
                <CopyButton text={step.setup.manualKey} label="Copy key" className="mt-2" />
              </div>
            </div>
            <CodeInput value={code} onChange={setCode} onComplete={enable2fa} disabled={busy} autoFocus label="Code from your app" />
            {error && <ErrorLine message={error} />}
            <Btn type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? 'Verifying…' : 'Verify and turn on 2FA'}
            </Btn>
          </form>
          {backBtn}
        </StepShell>
      )}

      {step.name === 'backup' && (
        <StepShell
          title="Save your backup codes"
          intro="2FA is on. If you lose your phone, each of these 10 codes can be used once to sign in. They are shown only now, so store them somewhere safe."
          headingRef={headingRef}
        >
          <BackupCodes codes={step.codes} />
          <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-brand"
            />
            I have saved these backup codes
          </label>
          <Btn className="mt-4 w-full" disabled={!saved} onClick={() => onSignedIn(step.user)}>
            Continue to dashboard
          </Btn>
        </StepShell>
      )}

      {step.name === 'code' && (
        <StepShell
          title="Enter your code"
          intro={
            step.backup
              ? 'Enter one of your unused backup codes. Each code works only once.'
              : 'Open your authenticator app and enter the 6-digit code for MAOUAJ admin.'
          }
          headingRef={headingRef}
        >
          <form onSubmit={submitCode} noValidate className="space-y-4">
            {step.backup ? (
              <Field label="Backup code">
                <TextInput
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                  className="font-mono tracking-wider"
                />
              </Field>
            ) : (
              <CodeInput value={code} onChange={setCode} onComplete={(v) => verify({ code: v })} disabled={busy} autoFocus />
            )}
            {error && <ErrorLine message={error} />}
            <Btn type="submit" className="w-full" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify and sign in'}
            </Btn>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-semibold text-brand hover:underline max-lg:min-h-11"
            onClick={() => {
              setError('');
              setCode('');
              setBackupCode('');
              setStep({ name: 'code', backup: !step.backup });
            }}
          >
            {step.backup ? 'Use my authenticator app instead' : 'Use a backup code instead'}
          </button>
          {backBtn}
        </StepShell>
      )}
    </div>
  );
}
