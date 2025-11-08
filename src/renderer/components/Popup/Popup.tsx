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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-black mb-2">Welcome to Memo-AI</h1>
        <p className="text-gray-600 mb-6">Allow access to microphone and camera for recording</p>

        <div className="space-y-4 mb-6">
          {/* Microphone Permission */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 size={20} className="text-black" />
              <div className="flex-1">
                <h3 className="font-semibold text-black">Microphone</h3>
                <p className="text-xs text-gray-600">
                  {micPermission === 'granted' ? 'Permission granted' : 
                   micPermission === 'denied' ? 'Permission denied' : 
                   'Permission pending'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                micPermission === 'granted' ? 'bg-green-500' :
                micPermission === 'denied' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>

            {micPermission === 'prompt' && (
              <button
                onClick={requestMicrophonePermission}
                className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition"
              >
                Request Permission
              </button>
            )}

            {micPermission === 'denied' && (
              <button
                onClick={handleOpenMicrophoneSettings}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition"
              >
                Open Settings
              </button>
            )}

            {micPermission === 'granted' && (
              <div className="text-sm text-green-600 font-medium">
                Ready to use
              </div>
            )}
          </div>

          {/* Camera Permission */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Camera size={20} className="text-black" />
              <div className="flex-1">
                <h3 className="font-semibold text-black">Camera</h3>
                <p className="text-xs text-gray-600">
                  {cameraPermission === 'granted' ? 'Permission granted' : 
                   cameraPermission === 'denied' ? 'Permission denied' : 
                   'Permission pending'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                cameraPermission === 'granted' ? 'bg-green-500' :
                cameraPermission === 'denied' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
            </div>

            {cameraPermission === 'prompt' && (
              <button
                onClick={requestCameraPermission}
                className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition"
              >
                Request Permission
              </button>
            )}

            {cameraPermission === 'denied' && (
              <button
                onClick={handleOpenCameraSettings}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition"
              >
                Open Settings
              </button>
            )}

            {cameraPermission === 'granted' && (
              <div className="text-sm text-green-600 font-medium">
                Ready to use
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition"
        >
          Continue to Memo-AI
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change these permissions anytime in Settings
        </p>
      </div>
    </div>
  );
}
