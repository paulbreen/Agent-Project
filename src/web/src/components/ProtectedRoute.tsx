import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthHook';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
