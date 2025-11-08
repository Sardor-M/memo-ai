import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type PublicRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * PublicRoute - Component to restrict access to public routes for authenticated users
 * This component checks if the user is authenticated.
 * If authenticated, it redirects the user to the specified page (default is /).
 */
export default function PublicRoute({ 
  children, 
  redirectTo = '/' 
}: PublicRouteProps) {
  const location = useLocation();

  // TODO: Add your authentication check here
  const isAuthenticated = false; // Placeholder

  if (isAuthenticated) {
    console.info('Already authenticated, redirecting from public route to:', redirectTo);
    const from = (location.state as { from?: string })?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

