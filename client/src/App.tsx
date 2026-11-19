import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import { PUBLIC_ROUTES, type PublicPage } from './lib/routes';
import { STATIC_CONTENT } from './lib/static-content';

const PAGES: Record<PublicPage, LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import('./pages/HomePage')),
  vision: lazy(() => import('./pages/VisionPage')),
  about: lazy(() => import('./pages/AboutPage')),
  team: lazy(() => import('./pages/TeamPage')),
  contact: lazy(() => import('./pages/ContactPage')),
  products: lazy(() => import('./pages/ProductsPage')),
  projects: lazy(() => import('./pages/ProjectsPage')),
  blog: lazy(() => import('./pages/BlogPage')),
  terms: lazy(() => import('./pages/TermsPage')),
  privacy: lazy(() => import('./pages/PrivacyPage')),
};
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminApp = /* @__PURE__ */ lazy(() => import('./pages/admin/AdminApp'));
/** Static version: no API, so the admin portal is replaced by a notice. */
const AdminUnavailablePage = /* @__PURE__ */ lazy(() => import('./pages/AdminUnavailablePage'));

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <Routes>
        <Route element={<SiteLayout />}>
          {PUBLIC_ROUTES.map(({ path, page }) => {
            const Page = PAGES[page];
            return <Route key={path} path={path} element={<Page />} />;
          })}
          {STATIC_CONTENT && <Route path="/admin/*" element={<AdminUnavailablePage />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {!STATIC_CONTENT && <Route path="/admin/*" element={<AdminApp />} />}
      </Routes>
    </Suspense>
  );
}
