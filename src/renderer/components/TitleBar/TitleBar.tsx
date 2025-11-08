import { useEffect, useState } from 'react';
import WindowControls from '../WindowControls/WindowControls';

type TitleBarProps = {
  title?: string;
  showControls?: boolean;
}

export default function TitleBar({ title = 'Memo-AI', showControls = true }: TitleBarProps) {
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('mac') > -1) {
      setPlatform('macos');
    }
  }, []);

  const isMacOS = platform === 'macos';

  return (
    <div
      className="w-full h-12 bg-black border-b border-gray-800 flex items-center justify-between select-none"
      style={{
        WebkitAppRegion: 'drag' as any,
        userSelect: 'none',
        paddingLeft: isMacOS ? '80px' : '16px',
        paddingRight: '16px',
      } as any}
    >
      {/* Title */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-semibold text-white">
          {title}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Window Controls */}
      {showControls && (
        <div
          style={{
            WebkitAppRegion: 'no-drag' as any,
          } as any}
        >
          <WindowControls />
        </div>
      )}
    </div>
  );
}

