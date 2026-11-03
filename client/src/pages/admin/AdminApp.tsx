import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmProvider } from '@/hooks/useConfirm';
import { ToastProvider } from '@/hooks/useToast';
import { AuthProvider, ProtectedRoute } from '@/lib/auth';
import DashboardPage from './DashboardPage';
import LeadsPage from './LeadsPage';
import LoginPage from './LoginPage';
import MediaPage from './MediaPage';
import SectionsPage from './SectionsPage';
import SettingsPage from './SettingsPage';
import { FaqsAdminPage, PostsAdminPage, ServicesPage, TeamAdminPage, TestimonialsPage } from './resources';
import AuditPage from './AuditPage';
import SecurityPage from './SecurityPage';
import UsersPage from './UsersPage';

/** Mounted at /admin/* — all paths below are relative to /admin. */
export default function AdminApp() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="sections" element={<SectionsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="team" element={<TeamAdminPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="faqs" element={<FaqsAdminPage />} />
              <Route path="posts" element={<PostsAdminPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route
                path="audit"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <AuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
