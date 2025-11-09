import  { useState, useEffect } from 'react';
import type { RecordingData } from '../../../types/electron';
import './Widget.css';

export default function Widget() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');

  useEffect(() => {
    if (typeof window.electronAPI?.onRecordingProgress !== 'function') {
      console.warn('onRecordingProgress API is not available; recording widget will not show live updates.');
      return;
    }

    const handler = (data: RecordingData) => {
      setDuration(data.duration);
      if (data.status === 'recording') {
        setIsRecording(true);
        setStatus('recording');
      } else if (data.status === 'idle') {
        setIsRecording(false);
        setStatus('idle');
      }
    };

    window.electronAPI.onRecordingProgress(handler);

    return () => {
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const result = await window.electronAPI.startRecording();
      if (result.success) {
        setIsRecording(true);
        setStatus('recording');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setStatus('processing');
      const result = await window.electronAPI.stopRecording();
      
      if (result.success && result.audioPath) {
        const transcriptResult = await window.electronAPI.transcribeAudio(
          result.audioPath
        );
        
        if (transcriptResult.success && transcriptResult.transcript) {
          await window.electronAPI.saveToDocx(
            transcriptResult.transcript,
            `recording-${Date.now()}.docx`
          );
        }
        
        setIsRecording(false);
        setStatus('idle');
        setDuration(0);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setStatus('idle');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <span className="widget-title">Recording Widget</span>
        <button
          className="close-btn"
          onClick={() => window.electronAPI.hideWidget()}
        >
          ✕
        </button>
      </div>

      <div className="widget-body">
        <div className="status-indicator">
          <div className={`status-dot ${status}`}></div>
          <span className="status-text">
            {status === 'idle' && 'Ready'}
            {status === 'recording' && 'Recording'}
            {status === 'processing' && 'Processing'}
          </span>
        </div>

        {isRecording && (
          <div className="duration-display">{formatDuration(duration)}</div>
        )}

        <div className="audio-visualizer">
          <div className="wave-bars">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`wave-bar ${isRecording ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="controls">
          {!isRecording ? (
            <button
              className="record-btn start"
              onClick={handleStartRecording}
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Processing...' : '● Start Recording'}
            </button>
          ) : (
            <button className="record-btn stop" onClick={handleStopRecording}>
              ■ Stop Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
