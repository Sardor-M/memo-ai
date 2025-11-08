interface RecordingData {
  duration: number;
  status: string;
}

interface RecordingResult {
  success: boolean;
  audioPath?: string;
}

interface TranscriptionResult {
  success: boolean;
  transcript?: string;
}

interface SaveResult {
  success: boolean;
}

interface ElectronAPI {
  // Recording functions
  startRecording: () => Promise<RecordingResult>;
  stopRecording: () => Promise<RecordingResult>;
  transcribeAudio: (audioPath: string) => Promise<TranscriptionResult>;
  saveToDocx: (content: string, filename: string) => Promise<SaveResult>;
  
  // Widget functions
  hideWidget: () => void;
  showWidget: () => Promise<{ success: boolean }>;
  closeWidget: () => Promise<{ success: boolean }>;
  onRecordingProgress: (callback: (data: RecordingData) => void) => void;
  onRecordingStateChange: (callback: (state: any) => void) => void;
  
  // Recording widget control
  minimizeRecordingWidget: () => Promise<void>;
  closeRecordingWidget: () => Promise<void>;
  
  // Window control functions
  minimizeWindow?: () => Promise<void>;
  maximizeWindow?: () => Promise<void>;
  closeWindow?: () => Promise<void>;
  
  // Utility
  getRecordings: () => Promise<any[]>;
  getAppPath: () => Promise<string>;

  // System settings
  openMicrophoneSettings: () => Promise<{ success: boolean }>;
  openCameraSettings: () => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { ElectronAPI, RecordingData, RecordingResult, TranscriptionResult, SaveResult };

