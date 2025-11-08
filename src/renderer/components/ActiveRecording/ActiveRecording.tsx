import { useState, useEffect } from 'react';
import { Volume2, VideoIcon, Zap, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ActiveRecordingProps {
  isVisible: boolean;
  onClose: () => void;
  onStop: () => void;
}

export default function ActiveRecording({ isVisible, onClose, onStop }: ActiveRecordingProps) {
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('notes');
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveformBars] = useState(Array(40).fill(0));

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Widget on Right Side */}
      <div
        className={`fixed right-4 z-50 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? 'w-96 bottom-4' : 'w-96 bottom-4'
        }`}
      >
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white">Recording</h2>
              <p className="text-xs text-gray-400">{formatTime(duration)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
              title="Minimize"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area - Only show when expanded */}
        {isExpanded && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 p-3 border-b border-gray-800 bg-gray-900/50">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition ${
                  activeTab === 'notes'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition ${
                  activeTab === 'transcript'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Volume2 size={14} />
                Transcript
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-gray-900 max-h-64 overflow-y-auto">
              {activeTab === 'notes' ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-xs">
                    📝 Notes will appear here.
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-500 text-center text-xs italic">
                      No notes yet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Waveform */}
                  <div className="flex items-end justify-center gap-0.5 h-16 bg-gray-800/30 rounded-lg p-2">
                    {waveformBars.map((_, i) => {
                      const height = Math.random() * 100;
                      const opacity = 0.3 + Math.random() * 0.7;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 rounded-full transition-all"
                          style={{
                            height: `${height}%`,
                            opacity: opacity,
                            animation: `pulse 0.3s ease-in-out infinite`,
                            animationDelay: `${i * 0.02}s`,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Transcript Text */}
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      "Notion AI will summarize the notes and transcript..."
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Indicators */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/50 flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Volume2 size={14} className="text-green-500" />
                <span className="text-gray-400">Mic</span>
              </div>
              <div className="flex items-center gap-1">
                <VideoIcon size={14} className="text-blue-500" />
                <span className="text-gray-400">Camera</span>
              </div>
            </div>
          </>
        )}

        {/* Footer - Controls */}
        <div className="flex items-center justify-between p-3 border-t border-gray-800 bg-black">
          <div className="flex items-center gap-2 text-xs">
            <Zap size={14} className="text-yellow-500" />
            <span className="text-gray-400">Recording</span>
          </div>

          <button
            onClick={onStop}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-xs"
          >
            ■ Stop
          </button>
        </div>
      </div>

      {/* Floating Actions */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

