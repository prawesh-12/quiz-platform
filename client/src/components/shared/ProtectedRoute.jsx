import { Navigate, Outlet } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, role, requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const expectedRole = role ?? requiredRole;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">Checking authentication...</CardContent>
        </Card>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (expectedRole && user?.role !== expectedRole) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}
