import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer } from './Footer';

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col bg-navy-950">
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
