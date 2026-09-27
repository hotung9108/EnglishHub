import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // TODO: Replace with a proper loading spinner
  }

  if (!isAuthenticated || !user) {
    // Redirect them to the /login page, but save the current location they were trying to go to when they were redirected.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized: redirect to /403 with detailed route diagnostic state
    return (
      <Navigate 
        to="/403" 
        state={{ 
          attemptedPath: location.pathname, 
          allowedRoles, 
          currentRole: user.role 
        }} 
        replace 
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
