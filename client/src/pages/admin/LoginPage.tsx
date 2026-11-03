import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '@/components/layout/Logo';
import { Btn, Field, TextInput } from '@/components/admin/ui';
import { errMsg } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth';
import { useSite } from '@/lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') });

export default function LoginPage() {
  const { user, login } = useAuth();
  const { data: site } = useSite();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Sign in | MAOUAJ admin';
  }, []);

  if (user) return <Navigate to={(loc.state as { from?: string } | null)?.from ?? '/admin'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav((loc.state as { from?: string } | null)?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-xl4 border border-white/20 bg-white p-8 shadow-card md:p-10">
        <div className="mb-8 rounded-2xl bg-navy-950 px-4 py-3">
          <Logo siteName={site?.siteName} logoUrl={site?.logoUrl} />
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Admin sign in</h1>
        <p className="mb-6 mt-1 text-sm text-ink-700">Manage website content, leads and settings.</p>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email">
            <TextInput type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label="Password">
            <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Btn type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Btn>
        </form>
      </div>
    </div>
  );
}
