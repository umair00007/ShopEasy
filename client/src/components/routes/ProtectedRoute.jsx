import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../Spinner.jsx';

// Wrap routes that need login. adminOnly also requires role === 'admin'.
// NOTE: this only improves UX. The REAL protection is the protect/adminOnly middleware on the server.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
