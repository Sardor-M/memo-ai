import { RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import Widget from '../components/Widget/Widget';
import RecordingWidget from '../windows/RecordingWidget';
import Loading from '../components/Loading';
import Settings from '../pages/Settings';

const withSuspense = (Component: React.ComponentType<any>) => (
  <Suspense fallback={<Loading />}>
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
    path: '/settings',
    element: <Settings />,
  },
  
  {
    path: '/recording-widget',
    element: <RecordingWidget />,
  },
  {
    path: '*',
    element: <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
    </div>,
  },
];

