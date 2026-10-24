import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Spinner } from './components/ui/Spinner';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PostFood } from './pages/PostFood';
import { Browse } from './pages/Browse';
import { DonationDetails } from './pages/DonationDetails';
import { Messages } from './pages/Messages';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import type { Role } from './types';

function PageLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center py-24">
      <Spinner className="size-8" label={t('common.loading')} />
    </div>
  );
}

/** Requires an authenticated session; otherwise redirects to /login with intent. */
function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoading />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/** Requires the signed-in user to hold the given role. */
function RoleRoute({ role }: { role: Role }) {
  const { profile, loading } = useAuth();

  if (loading) return <PageLoading />;
  if (!profile || profile.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/donations/:id" element={<DonationDetails />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />

          <Route element={<RoleRoute role="provider" />}>
            <Route path="/post" element={<PostFood />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
