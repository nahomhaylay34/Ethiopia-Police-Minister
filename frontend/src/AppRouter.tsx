import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import ReportsPage from './pages/ReportsPage';
import ReportCrimePage from './pages/ReportCrimePage';
import ReportDetailsPage from './pages/ReportDetailsPage';
import CasesPage from './pages/CasesPage';
import CaseDetailsPage from './pages/CaseDetailsPage';
import ProcessCriminalPage from './pages/ProcessCriminalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import VerifyAccountPage from './pages/VerifyAccountPage';
import MissingFugitivePage from './pages/MissingFugitivePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const RoleRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard/analytics" replace />;
  }

  if (user.role === 'citizen') {
    return <Navigate to="/dashboard/citizen" replace />;
  }

  return <Navigate to="/dashboard/officer" replace />;
};

const AppRouter = () => {
  const { user } = useAuth();

  const router = createBrowserRouter([
    {
      path: '/',
      element: user ? <Navigate to="/dashboard" replace /> : <LandingPage />,
    },
    {
      path: '/login',
      element: user ? <Navigate to="/dashboard" replace /> : <LoginPage />,
    },
    {
      path: '/register',
      element: user ? <Navigate to="/dashboard" replace /> : <RegisterPage />,
    },
    // ── Protected dashboard ─────────────────────────────────────────────────
    {
      path: '/dashboard',
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <RoleRedirect /> },
        {
          path: 'citizen',
          element: (
            <ProtectedRoute roles={['citizen']}>
              <DashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'officer',
          element: (
            <ProtectedRoute roles={['officer', 'detective']}>
              <OfficerDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'analytics',
          element: (
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin',
          element: (
            <ProtectedRoute roles={['admin']}>
              <AdminUserManagementPage />
            </ProtectedRoute>
          )
        },
        { path: 'reports', element: <ReportsPage /> },
        {
          path: 'reports/new',
          element: (
            <ProtectedRoute roles={['citizen', 'officer', 'detective', 'admin']}>
              <ReportCrimePage />
            </ProtectedRoute>
          )
        },
        { path: 'reports/:id', element: <ReportDetailsPage /> },
        { path: 'cases', element: <CasesPage /> },
        { path: 'cases/:id', element: <CaseDetailsPage /> },
        {
          path: 'criminals/process',
          element: (
            <ProtectedRoute roles={['officer', 'detective']}>
              <ProcessCriminalPage />
            </ProtectedRoute>
          )
        },
        { path: 'messages', element: <MessagesPage /> },
        { path: 'notifications', element: <NotificationsPage /> },
        {
          path: 'alerts/board',
          element: (
            <ProtectedRoute roles={['officer', 'detective', 'admin']}>
              <MissingFugitivePage />
            </ProtectedRoute>
          )
        }
      ]
    },
    {
      path: '/verify',
      element: <VerifyAccountPage />
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRouter;
