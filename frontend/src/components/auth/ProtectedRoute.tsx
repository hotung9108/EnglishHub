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
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#FAF8F5',
          gap: '16px',
        }}
      >
        <div
          className="eh-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E6DFD5',
            borderTopColor: '#1B4D3E',
            borderRadius: '50%',
            animation: 'ehSpin 800ms linear infinite',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            color: '#736B63',
            fontFamily: "var(--eh-font-serif, 'Lora', serif)",
            letterSpacing: '0.02em',
          }}
        >
          EnglishHub
        </span>
      </div>
    );
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
