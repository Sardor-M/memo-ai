import { useState, useEffect, useRef } from 'react';
import { Volume2, VideoIcon, Zap, X, Pause, Play, Save, Mic } from 'lucide-react';

export default function RecordingWidget() {
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('transcript');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notes, setNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [waveformBars, setWaveformBars] = useState(Array(60).fill(0));
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for recording state changes from main process
    window.electronAPI?.onRecordingStateChange?.((state: any) => {
      console.log('Recording state changed:', state);
      setIsRecording(state.isRecording);
      if (!state.isRecording) {
        setDuration(0);
        setIsPaused(false);
      }
    });
  }, []);

  // Fast waveform animation (updates every 50ms for smooth movement)
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
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(waveInterval);
  }, [isRecording, isPaused]);

  // Duration and transcript update every 1 second
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
      // Simulate LLM-generated transcript
      if (transcript.length < 500) {
        setTranscript(prev => prev + (Math.random() > 0.5 ? ' ' + Math.random().toString(36).substring(7) : ''));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, transcript]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      console.log('🎙️ Starting recording...');
      await window.electronAPI?.startRecording?.();
      setIsRecording(true);
      setTranscript('Recording started...\n');
      setNotes('');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStop = async () => {
    try {
      console.log('⏹️ Stopping recording...');
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
      console.log('💾 Saving transcript and notes...');
      
      const timestamp = new Date().toLocaleString();
      const content = `=== Memo-AI Recording ===\nDate: ${timestamp}\nDuration: ${formatTime(duration)}\n\n--- Transcript ---\n${transcript}\n\n--- Notes ---\n${notes}`;
      
      // Save to macOS local machine using IPC
      const result = await window.electronAPI?.saveToDocx?.(content, `memo-${Date.now()}.txt`);
      console.log('✅ Saved:', result);
      
      alert('✅ Recording saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    try {
      await window.electronAPI?.closeRecordingWidget?.();
    } catch (error) {
      console.error('Failed to close widget:', error);
    }
  };

  return (
    <div 
      ref={dragRef}
      className="w-full h-full bg-white flex flex-col overflow-hidden select-none shadow-2xl rounded-lg border border-gray-200"
    >
      {/* Header - DRAGGABLE */}
      <div 
        className="flex items-center justify-between p-4 bg-white border-b border-gray-200" 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <div>
            <h2 className="text-sm font-bold text-black">Memo-AI</h2>
            <p className={`text-xs font-mono ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
              {formatTime(duration)}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-red-500 cursor-pointer"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3 border-b border-gray-200 bg-gray-50">
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

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 bg-white">
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
                <div className="flex items-end justify-center gap-0.5 h-12 bg-gray-100 rounded-lg p-2 border border-gray-300 overflow-hidden">
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

              {/* Transcript Display */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-300 flex-1 overflow-y-auto max-h-full">
                <p className="text-black text-xs leading-relaxed whitespace-pre-wrap">
                  {transcript || '🎙️ Recording started - transcript will appear here...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
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
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50" style={{ WebkitAppRegion: 'no-drag' } as any}>
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

