import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type PublicRouteProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * PublicRoute - Component to restrict access to public routes for authenticated users
 * This component checks if the user is authenticated.
 * If authenticated, it redirects the user to the home page.
 * @param {PublicRouteProps} props - Props for the PublicRoute component
 */
export default function PublicRoute({ 
  children, 
  redirectTo = '/' 
}: PublicRouteProps) {
  const location = useLocation();
  
  // TODO: Implement authentication check
  // Replace with actual authentication logic
  const isAuthenticated = false; // For now, allow all access

  if (isAuthenticated) {
    console.info('Already authenticated, redirecting from login to:', redirectTo);
    const from = (location.state as { from: string })?.from || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

