import { RouteObject } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import Schedule from '../pages/Schedule';
import Calendar from '../pages/Calendar';
import Widget from '../components/Widget/Widget';
import RecordingWidget from '../windows/RecordingWidget';
import Settings from '../pages/Settings';


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
    path: '/schedule',
    element: <Schedule />,
  },
  {
    path: '/calendar',
    element: <Calendar />,
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

