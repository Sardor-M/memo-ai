import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WindowControls() {
  const [platform, setPlatform] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') > -1) {
      setPlatform('windows');
    } else if (userAgent.indexOf('mac') > -1) {
      setPlatform('macos');
    } else {
      setPlatform('linux');
    }
  }, []);

  const handleMinimize = async () => {
    await window.electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = async () => {
    await window.electronAPI?.maximizeWindow?.();
    setIsMaximized(!isMaximized);
  };

  const handleClose = async () => {
    await window.electronAPI?.closeWindow?.();
  };

  // macOS shows controls on the left, Windows/Linux on the right
  const isMacOS = platform === 'macos';

  if (platform === 'web') return null;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 bg-transparent ${
        isMacOS ? 'mr-auto' : 'ml-auto'
      }`}
    >
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
        title="Minimize"
      >
        <Minus
          size={16}
          className="text-white group-hover:text-gray-300"
        />
      </button>

      {/* Maximize/Restore Button */}
      <button
        onClick={handleMaximize}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors group"
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        <Square
          size={16}
          className="text-white group-hover:text-gray-300"
        />
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="p-1.5 hover:bg-red-600 rounded transition-colors group"
        title="Close"
      >
        <X
          size={16}
          className="text-white group-hover:text-white"
        />
      </button>
    </div>
  );
}

