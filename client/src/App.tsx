import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const VisionPage = lazy(() => import('./pages/VisionPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/our-vision" element={<VisionPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/our-team" element={<TeamPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/our-products" element={<ProductsPage />} />
          <Route path="/our-projects" element={<ProjectsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/terms-of-use" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </Suspense>
  );
}
