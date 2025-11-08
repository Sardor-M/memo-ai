import { RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import Widget from '../components/Widget/Widget';
import Analytics from '../pages/Analytics';

const ComponentLoading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#f5f5f7'
  }}>
    <div>
      <h2>Loading...</h2>
    </div>
  </div>
);

const withSuspense = (Component: React.ComponentType<any>) => (
  <Suspense fallback={<ComponentLoading />}>
    <Component />
  </Suspense>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/history',
    element: <History />,
  },
  {
    path: '/widget',
    element: <Widget />,
  },

  {
    path: '/analytics',
    element: <Analytics/>,
  },
  {
    path: '*',
    element: <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
    </div>,
  },
];

