import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

/**
 * ProtectedRoute - Component to protect routes based on authentication
 * For Electron app, this can be extended with proper auth checks
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const location = useLocation();

  // TODO: Add your authentication check here
  const isAuthenticated = true; // Placeholder

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

