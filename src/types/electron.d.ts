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
  startRecording: () => Promise<RecordingResult>;
  stopRecording: () => Promise<RecordingResult>;
  transcribeAudio: (audioPath: string) => Promise<TranscriptionResult>;
  saveToDocx: (content: string, filename: string) => Promise<SaveResult>;
  hideWidget: () => void;
  onRecordingProgress: (callback: (data: RecordingData) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { ElectronAPI, RecordingData, RecordingResult, TranscriptionResult, SaveResult };

