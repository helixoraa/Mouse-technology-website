import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { LoginFlow } from '@/components/admin/LoginFlow';
import { useAuth } from '@/lib/auth';
import { useSite } from '@/lib/api';

export default function LoginPage() {
  const { user, setUser } = useAuth();
  const { data: site } = useSite();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/admin';

  useEffect(() => {
    document.title = 'Sign in | MAOUAJ admin';
  }, []);

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-xl4 border border-white/20 bg-white p-6 shadow-card sm:p-8 md:p-10">
        <div className="mb-8 rounded-2xl bg-navy-950 px-4 py-3">
          <Logo siteName={site?.siteName} logoUrl={site?.logoUrl} />
        </div>
        <LoginFlow
          onSignedIn={(u) => {
            setUser(u);
            nav(from, { replace: true });
          }}
        />
      </div>
    </div>
  );
}
