import { useState, useEffect } from 'react';
import { Mic, AlertCircle } from 'lucide-react';

export default function Toolbar() {
  const [isRecording, setIsRecording] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    // Listen for recording state changes
    window.electronAPI?.onRecordingStateChange?.((state: any) => {
      setIsRecording(state.isRecording);
    });

    // Monitor system audio/camera activity
    const checkSystemAudio = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some(d => d.kind === 'audioinput' && d.deviceId !== 'default');
        const hasCamera = devices.some(d => d.kind === 'videoinput' && d.deviceId !== 'default');

        if ((hasMic || hasCamera) && !isRecording) {
          setIsMicActive(hasMic);
          setIsCameraActive(hasCamera);
          // Auto-trigger widget when system audio/camera is active
          if (hasMic || hasCamera) {
            handleOpenWidget();
          }
        }
      } catch (error) {
        console.log('Device detection error');
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', checkSystemAudio);
    return () => navigator.mediaDevices.removeEventListener('devicechange', checkSystemAudio);
  }, [isRecording]);

  const handleOpenWidget = async () => {
    try {
      // This will be handled by the main process to create the widget window
      await window.electronAPI?.startRecording?.();
    } catch (error) {
      console.error('Failed to open widget:', error);
    }
  };

  return (
    <div className="fixed top-12 right-4 z-40 flex items-center gap-2">
      {/* System Audio/Camera Indicator */}
      {(isMicActive || isCameraActive) && !isRecording && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="text-yellow-500 animate-pulse" />
          <span className="text-xs text-yellow-600 font-medium">
            {isMicActive && isCameraActive ? 'Mic & Camera Active' : isMicActive ? 'Microphone Active' : 'Camera Active'}
          </span>
        </div>
      )}

      {/* Recording Widget Trigger Button */}
      <button
        onClick={handleOpenWidget}
        disabled={isRecording}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
          isRecording
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isRecording ? 'Recording in progress' : 'Open Recording Widget'}
      >
        <Mic size={18} />
        <span className="text-sm">
          {isRecording ? 'Recording...' : 'Open Widget'}
        </span>
      </button>
    </div>
  );
}

