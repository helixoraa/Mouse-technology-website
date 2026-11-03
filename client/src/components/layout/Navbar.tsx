import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSite } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

export function Navbar() {
  const { data: site } = useSite();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const links = site?.nav ?? [];

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the menu and returns focus to the toggle; outside click closes it too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    // Close if the viewport grows into the desktop layout.
    const mq = window.matchMedia('(min-width: 1280px)');
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      mq.removeEventListener('change', onMq);
    };
  }, [open]);

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
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/30 px-4 text-sm font-semibold text-white hover:bg-white/10 xl:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <ul
          ref={menuRef}
          id="mobile-menu"
          className="absolute right-0 top-14 z-30 flex w-64 max-w-[calc(100vw-2.5rem)] flex-col gap-1 rounded-2xl border border-white/20 bg-navy-900 p-3 shadow-card xl:hidden"
        >
          {links.map((l) => (
            <li key={l.href}>
              <NavLink
                to={l.href}
                end={l.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center rounded-lg px-3 text-nav font-medium hover:bg-white/10',
                    isActive ? 'bg-white/[0.06] text-brand-sky' : 'text-white',
                  )
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
