import { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Play, Save, Mic, AlertCircle } from 'lucide-react';
import { useAssemblyAI } from '../hooks/useAssemblyAI';

const ASSEMBLY_AI_KEY = import.meta.env.VITE_ASSEMBLY_AI_KEY || 'a483a32d28e34ffa8ffc44bac0e13362';

export default function RecordingWidget() {
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('transcript');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notes, setNotes] = useState('');
  const [waveformBars, setWaveformBars] = useState(Array(60).fill(0));
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const {
    isConnected: isAIConnected,
    transcript,
    error: aiError,
    connect: connectAI,
    disconnect: disconnectAI,
    clearTranscript: clearAITranscript,
    clearError: clearAIError,
  } = useAssemblyAI({
    apiKey: ASSEMBLY_AI_KEY,
    onTranscript: (text) => console.log('Transcript:', text),
    onError: (error) => console.error('AI Error:', error),
    onConnectionChange: (connected) => console.log('Connected:', connected),
  });

  useEffect(() => {
    window.electronAPI?.onRecordingStateChange?.((state: any) => {
      console.log('Recording state changed:', state);
      setIsRecording(state.isRecording);
      if (!state.isRecording) {
        setDuration(0);
        setIsPaused(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) return;

    const waveInterval = setInterval(() => {
      setWaveformBars(prevBars => {
        const newBars = [...prevBars];
        // Shift bars to the left and add new bar on the right
        newBars.shift();
        // Add random height for new bar (0-100)
        const newHeight = Math.random() * 100;
        newBars.push(newHeight);
        return newBars;
      });
    }, 40); 

    return () => clearInterval(waveInterval);
  }, [isRecording, isPaused]);

  // Duration update every 1 second
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      clearAITranscript();
      clearAIError();
      
      await connectAI();
      await window.electronAPI?.startRecording?.();
      setIsRecording(true);
      setNotes('');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStop = async () => {
    try {
      disconnectAI();
      
      await window.electronAPI?.stopRecording?.();
      setIsRecording(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const timestamp = new Date().toLocaleString();
      const content = `=== Memo-AI Recording ===\nDate: ${timestamp}\nDuration: ${formatTime(duration)}\n\n--- Transcript ---\n${transcript}\n\n--- Notes ---\n${notes}`;
      
      await window.electronAPI?.saveToDocx?.(content, `memo-${Date.now()}.txt`);
      
      clearAITranscript();
      setNotes('');
      setDuration(0);
      
      alert('Recording saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      ref={dragRef}
      className="w-full h-full bg-gray-100 flex flex-col overflow-hidden select-none shadow-2xl rounded-lg border border-gray-200"
    >
      {/* Header - DRAGGABLE */}
      <div 
        className="flex items-center justify-between p-4 bg-black border-b border-gray-900/60"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
          <h2 className="text-sm font-bold text-white">Memo-AI</h2>
        </div>
        <div className="px-1" />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-gray-200 bg-gray-100">
        <div className="flex gap-2">
          <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white text-black border border-gray-300'
              : 'text-gray-600 hover:text-black hover:bg-gray-100 border border-transparent'
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          📝 Notes
          </button>
          <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
            activeTab === 'transcript'
              ? 'bg-white text-black border border-gray-300'
              : 'text-gray-600 hover:text-black hover:bg-gray-100 border border-transparent'
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          🎙️ Transcript
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700">
            <span className="text-gray-500">⏱</span>
            <span className="font-mono text-gray-800">{formatTime(duration)}</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md border ${isAIConnected ? 'border-green-300 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isAIConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {isAIConnected ? 'Transcripting...' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {activeTab === 'notes' ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="w-full h-full bg-gray-50 text-black text-xs rounded-lg p-3 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/10 outline-none resize-none cursor-text"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            />
          ) : (
            <div className="space-y-3">
              {/* Waveform - Fast dynamic animation */}
              {isRecording && (
                <div className="flex items-end justify-center gap-0.5 h-12 bg-white rounded-lg p-2 border border-gray-200 overflow-hidden">
                  {waveformBars.map((height, i) => (
                    <div
                      key={i}
                      className="bg-black rounded-sm transition-none"
                      style={{
                        flex: '1 0 auto',
                        height: `${height}%`,
                        minHeight: '1px',
                        width: `${100 / waveformBars.length}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Error Display */}
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs">{aiError}</p>
                </div>
              )}

              {/* Transcript Display */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 overflow-y-auto max-h-full">
                <div className="text-black text-xs leading-relaxed whitespace-pre-wrap">
                  {transcript ? (
                    <span>{transcript}</span>
                  ) : (
                    <span className="text-gray-500">🎙️ Recording started - transcript will appear here...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="p-3 border-t border-gray-200 bg-gray-100 flex justify-between items-center text-xs">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className={isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
              <span className={isRecording ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {isRecording ? 'On' : 'Off'}
              </span>
            </div>
          </div>
          <span className={isRecording ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {isRecording ? isPaused ? '⏸️ Paused' : '🔴 Recording' : '○ Idle'}
          </span>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-100" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex gap-2">
          {!isRecording ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold transition text-xs border border-black cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              <Mic size={16} />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg transition border border-gray-300 cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-xs border border-red-600 cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                ■ Stop
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || (!transcript && !notes)}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-semibold transition text-xs border border-black disabled:border-gray-300 cursor-pointer"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

