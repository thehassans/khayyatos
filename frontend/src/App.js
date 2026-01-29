import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardSkeleton, PageSkeleton, FormSkeleton } from './components/ui/Skeleton';

// Layouts - Keep these as regular imports for instant shell
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import WorkerLayout from './layouts/WorkerLayout';

// Auth Pages - Keep login fast
import LoginPage from './pages/auth/LoginPage';

// Lazy load all other pages for faster initial load
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminUserForm = lazy(() => import('./pages/admin/UserForm'));

const UserDashboard = lazy(() => import('./pages/user/Dashboard'));
const Workers = lazy(() => import('./pages/user/Workers'));
const WorkerForm = lazy(() => import('./pages/user/WorkerForm'));
const WorkerAmounts = lazy(() => import('./pages/user/WorkerAmounts'));
const Customers = lazy(() => import('./pages/user/Customers'));
const CustomerForm = lazy(() => import('./pages/user/CustomerForm'));
const Stitchings = lazy(() => import('./pages/user/Stitchings'));
const StitchingForm = lazy(() => import('./pages/user/StitchingForm'));
const Loyalty = lazy(() => import('./pages/user/Loyalty'));
const WhatsApp = lazy(() => import('./pages/user/WhatsApp'));
const Zatca = lazy(() => import('./pages/user/Zatca'));
const Settings = lazy(() => import('./pages/user/Settings'));

const WorkerDashboard = lazy(() => import('./pages/worker/Dashboard'));
const WorkerStitchings = lazy(() => import('./pages/worker/Stitchings'));
const WorkerAmountsPage = lazy(() => import('./pages/worker/Amounts'));
const WorkerSettings = lazy(() => import('./pages/worker/Settings'));

const TrackOrder = lazy(() => import('./pages/public/TrackOrder'));

// Loading wrapper for lazy components
const LazyPage = ({ children, skeleton = 'page' }) => {
  const skeletons = {
    dashboard: <DashboardSkeleton />,
    page: <PageSkeleton />,
    form: <FormSkeleton />
  };
  return (
    <Suspense fallback={skeletons[skeleton] || skeletons.page}>
      {children}
    </Suspense>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { i18n } = useTranslation();
  const isRTL = ['ar', 'ur'].includes(i18n.language);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Routes>
        {/* Public Routes */}
        <Route path="/track-order" element={<LazyPage><TrackOrder /></LazyPage>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<LazyPage skeleton="dashboard"><AdminDashboard /></LazyPage>} />
          <Route path="users" element={<LazyPage><AdminUsers /></LazyPage>} />
          <Route path="users/new" element={<LazyPage skeleton="form"><AdminUserForm /></LazyPage>} />
          <Route path="users/:id/edit" element={<LazyPage skeleton="form"><AdminUserForm /></LazyPage>} />
        </Route>

        {/* User Routes */}
        <Route path="/user" element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<LazyPage skeleton="dashboard"><UserDashboard /></LazyPage>} />
          <Route path="workers" element={<LazyPage><Workers /></LazyPage>} />
          <Route path="workers/new" element={<LazyPage skeleton="form"><WorkerForm /></LazyPage>} />
          <Route path="workers/:id/edit" element={<LazyPage skeleton="form"><WorkerForm /></LazyPage>} />
          <Route path="worker-amounts" element={<LazyPage><WorkerAmounts /></LazyPage>} />
          <Route path="customers" element={<LazyPage><Customers /></LazyPage>} />
          <Route path="customers/new" element={<LazyPage skeleton="form"><CustomerForm /></LazyPage>} />
          <Route path="customers/:id/edit" element={<LazyPage skeleton="form"><CustomerForm /></LazyPage>} />
          <Route path="stitchings" element={<LazyPage><Stitchings /></LazyPage>} />
          <Route path="stitchings/new" element={<LazyPage skeleton="form"><StitchingForm /></LazyPage>} />
          <Route path="stitchings/:id/edit" element={<LazyPage skeleton="form"><StitchingForm /></LazyPage>} />
          <Route path="loyalty" element={<LazyPage><Loyalty /></LazyPage>} />
          <Route path="whatsapp" element={<LazyPage><WhatsApp /></LazyPage>} />
          <Route path="zatca" element={<LazyPage><Zatca /></LazyPage>} />
          <Route path="settings" element={<LazyPage skeleton="form"><Settings /></LazyPage>} />
        </Route>

        {/* Worker Routes */}
        <Route path="/worker" element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="dashboard" element={<LazyPage skeleton="dashboard"><WorkerDashboard /></LazyPage>} />
          <Route path="stitchings" element={<LazyPage><WorkerStitchings /></LazyPage>} />
          <Route path="amounts" element={<LazyPage><WorkerAmountsPage /></LazyPage>} />
          <Route path="settings" element={<LazyPage skeleton="form"><WorkerSettings /></LazyPage>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
