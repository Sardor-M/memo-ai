import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, useRoutes, useLocation } from 'react-router-dom';
import { routes } from './routes/routes';
import { AppSidebar } from './components/AppSidebar';
import TitleBar from './components/TitleBar/TitleBar';
import Popup from './components/Popup/Popup';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
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

  const isWidget = location.pathname === '/widget' || location.pathname === '/recording-widget';

  if (isWidget) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 overflow-auto">{element}</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="border-b border-black/20 bg-white/70 py-3 backdrop-blur md:hidden">
              <div className="px-3">
                <SidebarTrigger variant="ghost" size="icon" />
              </div>
            </div>
            <main className="flex-1 overflow-auto bg-gray-100">{element}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [showPopup, setShowPopup] = useState(() => {
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
