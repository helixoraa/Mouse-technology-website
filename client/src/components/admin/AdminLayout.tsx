import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/lib/auth';
import { useSite } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Btn } from './ui';

const nav: { to: string; label: string; end?: boolean; admin?: boolean; group?: string }[] = [
  { to: '/admin', label: 'Dashboard', end: true, group: 'Overview' },
  { to: '/admin/leads', label: 'Leads inbox' },
  { to: '/admin/sections', label: 'Page sections', group: 'Content' },
  { to: '/admin/services', label: 'Services & projects' },
  { to: '/admin/team', label: 'Team' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/faqs', label: 'FAQs' },
  { to: '/admin/posts', label: 'Blog posts' },
  { to: '/admin/media', label: 'Media library' },
  { to: '/admin/settings', label: 'Site settings', group: 'Site' },
  { to: '/admin/users', label: 'Users', admin: true },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { data: site } = useSite();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.title = 'Admin | MAOUAJ Technology';
  }, []);

  const items = nav.filter((n) => !n.admin || user?.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-surface-soft lg:flex">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      {open && <div className="fixed inset-0 z-30 bg-navy-950/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar px-4 py-6 text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 px-2">
          <Logo siteName={site?.siteName} logoUrl={site?.logoUrl} />
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-sky">Admin portal</p>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto">
          {items.map((n) => (
            <div key={n.to}>
              {n.group && (
                <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted first:mt-0">{n.group}</p>
              )}
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-brand-press text-white' : 'text-text-onDark hover:bg-white/10',
                  )
                }
              >
                {n.label}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="mt-4 border-t border-white/15 pt-4">
          <p className="truncate px-2 text-sm font-bold">{user?.name}</p>
          <p className="truncate px-2 text-xs text-text-muted">
            {user?.email} · {user?.role}
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-white/25 px-3 py-2 text-center text-xs font-bold hover:bg-white/10"
            >
              View site ↗
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
          <Btn variant="secondary" size="sm" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen((o) => !o)}>
            ☰ Menu
          </Btn>
          <span className="text-sm font-bold text-ink">Admin</span>
        </div>
        <main id="admin-main" className="mx-auto max-w-[1200px] px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
