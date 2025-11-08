import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Widget from './components/Widget/Widget';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/widget') {
      document.body.style.background = 'transparent';
    } else {
      document.body.style.background = '#f5f5f7';
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/widget" element={<Widget />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}