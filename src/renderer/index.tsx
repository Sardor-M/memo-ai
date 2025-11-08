import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, useRoutes, useLocation } from 'react-router-dom';
import { routes } from './routes/routes';
import './App.css';

function AppContent() {
  const location = useLocation();
  const element = useRoutes(routes);

  useEffect(() => {
    if (location.pathname === '/widget') {
      document.body.style.background = 'transparent';
    } else {
      document.body.style.background = '#f5f5f7';
    }
  }, [location]);

  return <>{element}</>;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
