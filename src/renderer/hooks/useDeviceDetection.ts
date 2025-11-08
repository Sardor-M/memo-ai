import { useState, useEffect } from 'react';

type DeviceState = {
  isMicrophoneActive: boolean;
  isCameraActive: boolean;
  isRecording: boolean;
  microphonePermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  cameraPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
 }

export function useDeviceDetection() {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    isMicrophoneActive: false,
    isCameraActive: false,
    isRecording: false,
    microphonePermission: 'unknown',
    cameraPermission: 'unknown',
  });

  const [autoStartEnabled, setAutoStartEnabled] = useState(true);

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

    // Check device permissions using Permissions API
    const checkPermissions = async () => {
      try {
        // Check microphone permission
        const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
        console.log('🎤 Microphone permission:', micStatus.state);
        
        // Check camera permission
        const cameraStatus = await navigator.permissions.query({ name: 'camera' as any });
        console.log('📹 Camera permission:', cameraStatus.state);

        setDeviceState(prev => ({
          ...prev,
          microphonePermission: micStatus.state as any,
          cameraPermission: cameraStatus.state as any,
        }));

        // Auto-start recording if both enabled
        if (
          autoStartEnabled &&
          (micStatus.state === 'granted' || cameraStatus.state === 'granted')
        ) {
          console.log('✅ Devices detected - auto-triggering widget');
          setTimeout(() => startRecording(), 500);
        }

        // Listen for permission changes
        micStatus.addEventListener('change', checkPermissions);
        cameraStatus.addEventListener('change', checkPermissions);

        return () => {
          micStatus.removeEventListener('change', checkPermissions);
          cameraStatus.removeEventListener('change', checkPermissions);
        };
      } catch (error) {
        console.log('Could not check permissions:', error);
      }
    };

    // Request microphone access (triggers system prompt)
    const requestAudioAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Microphone access granted');
        setDeviceState(prev => ({
          ...prev,
          microphonePermission: 'granted',
          isMicrophoneActive: true,
        }));
      } catch (error) {
        setDeviceState(prev => ({
          ...prev,
          microphonePermission: 'denied',
        }));
      }
    };

    // Request camera access (triggers system prompt)
    const requestVideoAccess = async () => {
      try {
        console.log('📹 Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setDeviceState(prev => ({
          ...prev,
          cameraPermission: 'granted',
          isCameraActive: true,
        }));
      } catch (error) {
        setDeviceState(prev => ({
          ...prev,
          cameraPermission: 'denied',
        }));
      }
    };

    // Check if devices are available
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput' && device.deviceId !== 'default');
        const hasCamera = devices.some(device => device.kind === 'videoinput' && device.deviceId !== 'default');

        console.log(`📊 Device check - Microphone: ${hasMicrophone}, Camera: ${hasCamera}`);

        if (hasMicrophone || hasCamera) {
          setDeviceState(prev => ({
            ...prev,
            isMicrophoneActive: hasMicrophone,
            isCameraActive: hasCamera,
          }));

          // Auto-start recording if enabled
          if (autoStartEnabled && !deviceState.isRecording && (hasMicrophone || hasCamera)) {
            console.log('🚀 Auto-starting recording...');
            setTimeout(() => startRecording(), 300);
          }
        }
      } catch (error) {
        console.log('Could not enumerate devices:', error);
      }
    };

    // Initial checks
    checkPermissions();
    checkDevices();

    // Listen for device change events
    const deviceChangeHandler = () => checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', deviceChangeHandler);

    // Listen for recording events from main process
    window.addEventListener('recording-start', handleRecordingStart as EventListener);
    window.addEventListener('recording-stop', handleRecordingStop as EventListener);

    // Poll for device changes every 2 seconds
    const pollInterval = setInterval(checkDevices, 2000);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', deviceChangeHandler);
      window.removeEventListener('recording-start', handleRecordingStart as EventListener);
      window.removeEventListener('recording-stop', handleRecordingStop as EventListener);
      clearInterval(pollInterval);
    };
  }, [autoStartEnabled, deviceState.isRecording]);

  const startRecording = async () => {
    console.log('🎙️ Starting recording...');
    setDeviceState(prev => ({
      ...prev,
      isRecording: true,
      isMicrophoneActive: true,
    }));
    // Trigger main process recording
    await window.electronAPI?.startRecording?.();
  };

  const stopRecording = async () => {
    console.log('⏹️ Stopping recording...');
    setDeviceState(prev => ({
      ...prev,
      isRecording: false,
      isMicrophoneActive: false,
    }));
    // Trigger main process stop
    await window.electronAPI?.stopRecording?.();
  };

  const requestMicrophonePermission = async () => {
    try {
      await requestAudioAccess();
      // If denied, show system settings link
      setTimeout(() => {
        if (deviceState.microphonePermission === 'denied') {
          const macOS = process.platform === 'darwin' || navigator.userAgent.includes('Mac');
          if (macOS) {
            // Open macOS System Settings for microphone privacy
            console.log('Opening macOS System Preferences for Microphone access');
            // User will need to manually open: System Settings → Privacy & Security → Microphone
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await requestVideoAccess();
      // If denied, show system settings link
      setTimeout(() => {
        if (deviceState.cameraPermission === 'denied') {
          const macOS = process.platform === 'darwin' || navigator.userAgent.includes('Mac');
          if (macOS) {
            // Open macOS System Settings for camera privacy
            console.log('Opening macOS System Preferences for Camera access');
            // User will need to manually open: System Settings → Privacy & Security → Camera
          }
        }
      }, 500);
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  return {
    ...deviceState,
    autoStartEnabled,
    setAutoStartEnabled,
    startRecording,
    stopRecording,
    requestMicrophonePermission,
    requestCameraPermission,
  };
}

