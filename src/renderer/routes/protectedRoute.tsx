import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * ProtectedRoute - Component to restrict access to protected routes
 * This component checks if the user is authenticated.
 * If not authenticated, it redirects the user to the home page.
 * @param {ProtectedRouteProps} props - Props for the ProtectedRoute component
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // TODO: Implement authentication check
  // Replace with actual authentication logic
  const isAuthenticated = true; // For now, allow all access

  if (!isAuthenticated) {
    console.warn('Access denied, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

