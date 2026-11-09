import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer } from './Footer';

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    // Section backgrounds run full width; each section caps its own content (gutter + max-w-page = the 1440 frame).
    <div className="flex min-h-screen flex-col bg-navy-950">
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
