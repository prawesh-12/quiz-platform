import { Navigate, Outlet } from "react-router-dom";

import LoadingScreen from "@/components/shared/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, role, requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const expectedRole = role ?? requiredRole;

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (expectedRole && user?.role !== expectedRole) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
