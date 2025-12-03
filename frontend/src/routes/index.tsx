import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from '@/components';
import {
  WelcomePage,
  LoginPage,
  RegisterPage,
  RoleSelectPage,
  ScanPage,
  CustomerHomePage,
  CustomerLandingPage,
  CustomerJoinPage,
  CustomerStatusPage,
  OwnerOnboardingPage,
  OwnerDashboardPage,
  OwnerQueueDetailPage,
  ProfilePage,
} from '@/pages';

export function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root to welcome */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />

      {/* Guest routes (redirect if authenticated) */}
      <Route
        path="/welcome"
        element={
          <GuestRoute>
            <WelcomePage />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register/role"
        element={
          <GuestRoute>
            <RoleSelectPage />
          </GuestRoute>
        }
      />

      {/* Owner onboarding (special case - partially authenticated) */}
      <Route path="/owner/onboarding" element={<OwnerOnboardingPage />} />

      {/* Customer routes (protected, require CUSTOMER role) */}
      <Route
        path="/home"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <CustomerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <ScanPage />
          </ProtectedRoute>
        }
      />

      {/* Queue routes (can be accessed by anyone to join) */}
      <Route path="/restaurant/:id" element={<CustomerLandingPage />} />
      <Route path="/queue/:queueId" element={<CustomerJoinPage />} />
      <Route
        path="/queue/:queueId/status"
        element={
          <ProtectedRoute requireAuth={false}>
            <CustomerStatusPage />
          </ProtectedRoute>
        }
      />

      {/* Owner routes (protected, require OWNER role) */}
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute requiredRole="OWNER">
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/queue/:queueId"
        element={
          <ProtectedRoute requiredRole="OWNER">
            <OwnerQueueDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Profile route (protected, any authenticated user) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default AppRoutes;
