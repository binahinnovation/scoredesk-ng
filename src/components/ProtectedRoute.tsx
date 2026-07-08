import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredPermission, fallback }: ProtectedRouteProps) {
  const { hasPermission, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
