import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import Dashboard from './pages/dashboard/Dashboard';
import Widget from './components/Widget/Widget';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/widget') {
      document.body.style.background = 'transparent';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.background = '#f5f5f7';
      document.body.style.overflow = 'auto';
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Widget />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;