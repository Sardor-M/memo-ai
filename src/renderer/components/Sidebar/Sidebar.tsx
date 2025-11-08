import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  History, 
  BarChart3, 
  Settings, 
  Menu, 
  X
} from 'lucide-react';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> },
   // { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-16 left-4 z-50 p-2 bg-black hover:bg-gray-900 rounded-lg text-white border border-gray-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative left-0 top-12 md:top-0 h-[calc(100vh-48px)] md:h-screen bg-black text-white transition-all duration-300 z-40 border-r border-gray-800 ${
          isOpen ? 'w-64' : 'w-0 md:w-64 md:block'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center text-lg">
              🎙️
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Memo-AI</h1>
              <p className="text-xs text-gray-400">v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-gray-800" />

        {/* Stats */}
        <div className="px-4 space-y-3 text-xs">
          <div>
            <p className="text-gray-400 mb-1">Total Recordings</p>
            <p className="text-white font-semibold">12</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Total Duration</p>
            <p className="text-white font-semibold">4h 32m</p>
          </div>
        </div>
      </aside>
    </>
  );
}

