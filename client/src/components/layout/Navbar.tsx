import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSite } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

export function Navbar() {
  const { data: site } = useSite();
  const [open, setOpen] = useState(false);
  const links = site?.nav ?? [];
  return (
    <nav aria-label="Primary" className="relative z-20 flex h-12 items-center justify-between">
      <Logo siteName={site?.siteName} logoUrl={site?.logoUrl} />
      <ul className="hidden items-start gap-[30px] text-nav font-medium xl:flex">
        {links.map((l) => (
          <li key={l.href}>
            <NavLink
              to={l.href}
              end={l.href === '/'}
              className={({ isActive }) => cn('transition-colors hover:text-brand-sky', isActive ? 'text-brand-sky' : 'text-white')}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white xl:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <ul
          id="mobile-menu"
          className="absolute right-0 top-14 z-30 flex w-64 flex-col gap-1 rounded-2xl border border-white/20 bg-navy-900 p-3 shadow-card xl:hidden"
        >
          {links.map((l) => (
            <li key={l.href}>
              <NavLink
                to={l.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('block rounded-lg px-3 py-2 text-nav font-medium hover:bg-white/10', isActive ? 'text-brand-sky' : 'text-white')
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
