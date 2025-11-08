import { useEffect, useState } from 'react';

type TitleBarProps = {
  title?: string;
}

export default function TitleBar({ title = 'Memo-AI' }: TitleBarProps) {
  const [isMacOS, setIsMacOS] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMacOS(userAgent.indexOf('mac') > -1);
  }, []);

  const titleBarStyle: React.CSSProperties & { WebkitAppRegion: string } = {
    WebkitAppRegion: 'drag',
    userSelect: 'none',
    paddingLeft: isMacOS ? '80px' : '16px',
    paddingRight: '16px',
  } as any;

  return (
    <div
      className="w-full h-12 bg-black border-b border-gray-800 flex items-center select-none"
      style={titleBarStyle}
    >
      <span className="text-sm font-semibold text-white">
        {title}
      </span>
    </div>
  );
}

