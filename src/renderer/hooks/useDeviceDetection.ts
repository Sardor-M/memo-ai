import { useState, useEffect } from 'react';

interface DeviceState {
  isMicrophoneActive: boolean;
  isCameraActive: boolean;
  isRecording: boolean;
}

export function useDeviceDetection() {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    isMicrophoneActive: false,
    isCameraActive: false,
    isRecording: false,
  });

  useEffect(() => {
    // Listen for recording start from main process
    const handleRecordingStart = () => {
      setDeviceState(prev => ({
        ...prev,
        isMicrophoneActive: true,
        isRecording: true,
      }));
    };

    // Listen for recording stop
    const handleRecordingStop = () => {
      setDeviceState(prev => ({
        ...prev,
        isMicrophoneActive: false,
        isCameraActive: false,
        isRecording: false,
      }));
    };

    // Request microphone access (triggers system prompt)
    const requestAudioAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Don't keep the stream active, just check if permission was granted
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.log('Audio access denied or unavailable');
      }
    };

    // Request camera access (triggers system prompt)
    const requestVideoAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.log('Video access denied or unavailable');
      }
    };

    // Check if devices are available
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (hasMicrophone || hasCamera) {
          setDeviceState(prev => ({
            ...prev,
            isMicrophoneActive: hasMicrophone,
            isCameraActive: hasCamera,
          }));
        }
      } catch (error) {
        console.log('Could not enumerate devices');
      }
    };

    checkDevices();

    // Listen for device change events
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);

    // Listen for recording events from main process
    window.addEventListener('recording-start', handleRecordingStart as EventListener);
    window.addEventListener('recording-stop', handleRecordingStop as EventListener);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
      window.removeEventListener('recording-start', handleRecordingStart as EventListener);
      window.removeEventListener('recording-stop', handleRecordingStop as EventListener);
    };
  }, []);

  const startRecording = async () => {
    setDeviceState(prev => ({
      ...prev,
      isRecording: true,
      isMicrophoneActive: true,
    }));
    // Trigger main process recording
    await window.electronAPI?.startRecording?.();
  };

  const stopRecording = async () => {
    setDeviceState(prev => ({
      ...prev,
      isRecording: false,
      isMicrophoneActive: false,
    }));
    // Trigger main process stop
    await window.electronAPI?.stopRecording?.();
  };

  return {
    ...deviceState,
    startRecording,
    stopRecording,
  };
}

