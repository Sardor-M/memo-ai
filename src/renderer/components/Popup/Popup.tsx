import { useEffect, useState } from 'react';
import { Volume2, Camera } from 'lucide-react';

type PopupProps = {
  onComplete?: () => void;
}

export default function Popup({ onComplete }: PopupProps) {
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    // Check initial permissions
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      const camera = await navigator.permissions.query({ name: 'camera' as any });
      
      setMicPermission(mic.state as any);
      setCameraPermission(camera.state as any);
    } catch (error) {
      console.log('Permission check failed:', error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      console.log('Microphone permission granted');
    } catch (error) {
      setMicPermission('denied');
      console.log('Microphone permission denied');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      console.log('Camera permission granted');
    } catch (error) {
      setCameraPermission('denied');
      console.log('Camera permission denied');
    }
  };

  const handleOpenMicrophoneSettings = async () => {
    if (process.platform === 'darwin' || navigator.userAgent.includes('Mac')) {
      await window.electronAPI?.openMicrophoneSettings?.();
    }
  };

  const handleOpenCameraSettings = async () => {
    if (process.platform === 'darwin' || navigator.userAgent.includes('Mac')) {
      await window.electronAPI?.openCameraSettings?.();
    }
  };

  const handleContinue = () => {
    setShowPopup(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!showPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/5 bg-white/95 p-5 shadow-2xl shadow-black/20">
        <h1 className="text-xl font-semibold text-black">Welcome to Memo-AI</h1>
        <p className="mt-1 text-xs text-gray-600">Allow access to microphone and camera for recording.</p>

        <div className="mt-4 space-y-3">
          {/* Microphone Permission */}
          <div className="rounded-lg border border-gray-200/70 bg-white/70 p-3">
            <div className="mb-2 flex items-center gap-3">
              <Volume2 size={18} className="text-black" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-black">Microphone</h3>
                <p className="text-[11px] text-gray-600">
                  {micPermission === 'granted' ? 'Permission granted' : 
                   micPermission === 'denied' ? 'Permission denied' : 
                   'Permission pending'}
                </p>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${
                micPermission === 'granted' ? 'bg-green-500' :
                micPermission === 'denied' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>

            {micPermission === 'prompt' && (
              <button
                onClick={requestMicrophonePermission}
                className="w-full rounded-md bg-black px-3 py-2 text-[12px] font-medium text-white transition hover:bg-gray-900"
              >
                Request Permission
              </button>
            )}

            {micPermission === 'denied' && (
              <button
                onClick={handleOpenMicrophoneSettings}
                className="w-full rounded-md bg-red-600 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-red-700"
              >
                Open Settings
              </button>
            )}

            {micPermission === 'granted' && (
              <div className="text-[11px] font-medium text-green-600">
                Ready to use
              </div>
            )}
          </div>

          {/* Camera Permission */}
          <div className="rounded-lg border border-gray-200/70 bg-white/70 p-3">
            <div className="mb-2 flex items-center gap-3">
              <Camera size={18} className="text-black" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-black">Camera</h3>
                <p className="text-[11px] text-gray-600">
                  {cameraPermission === 'granted' ? 'Permission granted' : 
                   cameraPermission === 'denied' ? 'Permission denied' : 
                   'Permission pending'}
                </p>
              </div>
              <div className={`h-2.5 w-2.5 rounded-full ${
                cameraPermission === 'granted' ? 'bg-green-500' :
                cameraPermission === 'denied' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>

            {cameraPermission === 'prompt' && (
              <button
                onClick={requestCameraPermission}
                className="w-full rounded-md bg-black px-3 py-2 text-[12px] font-medium text-white transition hover:bg-gray-900"
              >
                Request Permission
              </button>
            )}

            {cameraPermission === 'denied' && (
              <button
                onClick={handleOpenCameraSettings}
                className="w-full rounded-md bg-red-600 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-red-700"
              >
                Open Settings
              </button>
            )}

            {cameraPermission === 'granted' && (
              <div className="text-[11px] font-medium text-green-600">
                Ready to use
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="mt-4 w-full rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Continue to Memo-AI
        </button>

        <p className="mt-3 text-[11px] text-center text-gray-500">
          You can change these permissions anytime in Settings.
        </p>
      </div>
    </div>
  );
}
