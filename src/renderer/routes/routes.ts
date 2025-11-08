import { RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import ComponentLoading from '@/components/ComponentLoading';

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<ComponentLoading />}>
    <Component />
  </Suspense>
);

const withProtection = (Component: React.ComponentType) => {
  const ProtectedRoute = React.lazy(() => import('./protectedRoute'));
  return (
    <Suspense fallback={<ComponentLoading />}>
      <React.Suspense fallback={<ComponentLoading />}>
        <ProtectedRoute>
          <Component />
        </ProtectedRoute>
      </React.Suspense>
    </Suspense>
  );
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: withSuspense(React.lazy(() => import('@/pages/Dashboard'))),
  },
  {
    path: '/widget',
    element: withSuspense(React.lazy(() => import('@/components/widget/Widget'))),
  },
  {
    path: '*',
    element: withSuspense(React.lazy(() => import('@/components/NotFound'))),
  },
];

