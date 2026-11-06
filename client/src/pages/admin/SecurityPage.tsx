import { useEffect, useState, type FormEvent } from 'react';
import { PasswordStrength } from '@/components/admin/SecurityBits';
import { Btn, Card, Field, PageHeader, TextInput } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { errMsg } from '@/lib/admin-api';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isStrongPassword } from '@/lib/password';

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const m = useAdminMutation(
    () =>
      api<{ ok: true }>('/admin/security/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      }),
    'Password changed',
    () => {
      setCurrent('');
      setNext('');
      setConfirm('');
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!current) return setError('Enter your current password.');
    if (!isStrongPassword(next)) return setError('Choose a stronger new password that meets every rule.');
    if (next === current) return setError('Your new password must be different from the current one.');
    if (next !== confirm) return setError('The two new passwords do not match.');
    m.mutate(undefined, { onError: (err) => setError(errMsg(err)) });
  };
  return (
    <Card className="p-6">
      <h2 className="text-lg font-extrabold text-ink">Change password</h2>
      <p className="mb-4 mt-1 text-sm text-ink-700">Requires your current password. Other devices are signed out.</p>
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
  useEffect(() => {
    document.title = 'Security | MAOUAJ admin';
  }, []);

  return (
    <>
      <PageHeader title="Security" description={`Signed in as ${user?.email ?? ''}.`} />
      <ChangePasswordCard />
    </>
  );
}
