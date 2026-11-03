import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/admin/Modal';
import { BackupCodes, CodeInput, PasswordStrength } from '@/components/admin/SecurityBits';
import { Badge, Btn, Card, ErrorState, Field, PageHeader, Spinner, TextInput } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { errMsg, type SecurityStatus } from '@/lib/admin-api';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isStrongPassword } from '@/lib/password';

function RegenerateModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const m = useAdminMutation(
    (c: string) => api<{ backupCodes: string[] }>('/admin/security/backup-codes', { method: 'POST', body: JSON.stringify({ code: c }) }),
    undefined,
    (r) => setCodes(r.backupCodes),
  );
  const submit = (c: string) => {
    if (m.isPending) return;
    setError('');
    m.mutate(c, {
      onError: (e) => {
        setError(errMsg(e));
        setCode('');
      },
    });
  };
  return (
    <Modal title="Regenerate backup codes" size="sm" onClose={onClose}>
      {codes ? (
        <>
          <p className="mb-4 text-sm text-ink-700">Your old backup codes no longer work. These 10 new codes are shown only once.</p>
          <BackupCodes codes={codes} />
          <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-brand"
            />
            I have saved these backup codes
          </label>
          <div className="mt-4 flex justify-end">
            <Btn disabled={!saved} onClick={onClose}>
              Done
            </Btn>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (code.length === 6) submit(code);
            else setError('Enter the 6-digit code from your authenticator app.');
          }}
          className="space-y-4"
          noValidate
        >
          <p className="text-sm text-ink-700">
            Generating new codes invalidates all your current backup codes. Confirm with a current code from your authenticator app.
          </p>
          <CodeInput value={code} onChange={setCode} onComplete={submit} disabled={m.isPending} autoFocus />
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={onClose}>
              Cancel
            </Btn>
            <Btn type="submit" disabled={m.isPending || code.length !== 6}>
              {m.isPending ? 'Generating…' : 'Generate new codes'}
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const m = useAdminMutation(
    () =>
      api<{ ok: true }>('/admin/security/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next, code }),
      }),
    'Password changed',
    () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      setCode('');
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!current) return setError('Enter your current password.');
    if (!isStrongPassword(next)) return setError('Choose a stronger new password that meets every rule.');
    if (next === current) return setError('Your new password must be different from the current one.');
    if (next !== confirm) return setError('The two new passwords do not match.');
    if (code.length !== 6) return setError('Enter the 6-digit code from your authenticator app.');
    m.mutate(undefined, {
      onError: (err) => {
        setError(errMsg(err));
        setCode('');
      },
    });
  };
  return (
    <Card className="p-6">
      <h2 className="text-lg font-extrabold text-ink">Change password</h2>
      <p className="mb-4 mt-1 text-sm text-ink-700">Requires your current password and a current 2FA code. Other devices are signed out.</p>
      <form onSubmit={submit} noValidate className="max-w-md space-y-4">
        <Field label="Current password">
          <TextInput type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <div>
          <Field label="New password">
            <TextInput type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <PasswordStrength value={next} />
        </div>
        <Field label="Confirm new password">
          <TextInput type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <CodeInput value={code} onChange={setCode} disabled={m.isPending} />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <Btn type="submit" disabled={m.isPending}>
          {m.isPending ? 'Saving…' : 'Change password'}
        </Btn>
      </form>
    </Card>
  );
}

export default function SecurityPage() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['admin', 'security'], queryFn: () => api<SecurityStatus>('/admin/security') });
  const [regen, setRegen] = useState(false);
  useEffect(() => {
    document.title = 'Security | MAOUAJ admin';
  }, []);

  return (
    <>
      <PageHeader
        title="Security"
        description={`Signed in as ${user?.email ?? ''}. Two-factor authentication is required for every account.`}
      />
      {q.isLoading ? (
        <Spinner />
      ) : q.isError || !q.data ? (
        <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-ink">Two-factor authentication</h2>
                <p className="mt-1 text-sm text-ink-700">Google Authenticator (or any TOTP app) is asked for at every sign in.</p>
              </div>
              <Badge tone={q.data.totpEnabled ? 'success' : 'warn'}>{q.data.totpEnabled ? 'Enabled' : 'Not set up'}</Badge>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface-soft p-4">
              <div>
                <p className="text-sm font-bold text-ink">Backup codes</p>
                <p className="text-sm text-ink-700" aria-live="polite">
                  {q.data.backupCodesRemaining} of 10 unused
                  {q.data.backupCodesRemaining <= 2 && <span className="ml-2 font-bold text-warn">Running low, regenerate soon</span>}
                </p>
              </div>
              <Btn variant="secondary" onClick={() => setRegen(true)} disabled={!q.data.totpEnabled}>
                Regenerate backup codes
              </Btn>
            </div>
          </Card>
          <ChangePasswordCard />
        </div>
      )}
      {regen && (
        <RegenerateModal
          onClose={() => {
            setRegen(false);
            void q.refetch();
          }}
        />
      )}
    </>
  );
}
