import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, useRoutes, useLocation } from 'react-router-dom';
import { routes } from './routes/routes';
import Sidebar from './components/Sidebar/Sidebar';
import TitleBar from './components/TitleBar/TitleBar';
import Popup from './components/Popup/Popup';
import './App.css';

function AppContent() {
  const location = useLocation();
  const element = useRoutes(routes);

  useEffect(() => {
    if (location.pathname === '/widget' || location.pathname === '/recording-widget') {
      document.body.style.background = 'transparent';
    } else {
      document.body.style.background = '#f5f5f7';
    }
  }, [location]);

  // Don't show sidebar and titlebar on widget pages
  const isWidget = location.pathname === '/widget' || location.pathname === '/recording-widget';

  return (
    <div className="flex flex-col h-screen">
      {/* Title Bar with Window Controls */}
      {!isWidget && <TitleBar />}
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {!isWidget && <Sidebar />}
        <div className="flex-1 overflow-hidden">
          {element}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showPopup, setShowPopup] = useState(() => {
    // Check if first time launch
    const hasSeenPopup = localStorage.getItem('memo-ai-popup-shown');
    return !hasSeenPopup;
  });

  const handlePopupComplete = () => {
    localStorage.setItem('memo-ai-popup-shown', 'true');
    setShowPopup(false);
  };

  return (
    <Router>
      {showPopup && <Popup onComplete={handlePopupComplete} />}
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
