interface RecordingData {
  duration: number;
  status: string;
}

interface RecordingResult {
  success: boolean;
  audioPath?: string;
}



interface SaveResult {
  success: boolean;
}

interface ElectronAPI {
  startRecording: () => Promise<RecordingResult>;
  stopRecording: () => Promise<RecordingResult>;
  transcribeBuffer: (buffer:Buffer) => Promise<TranscriptionResult>;
 // transcribeAudio: (audioPath: string) => Promise<TranscriptionResult>;
  saveToDocx: (content: string, filename: string) => Promise<SaveResult>;
  hideWidget: () => void;
  onRecordingProgress: (callback: (data: RecordingData) => void) => void;

  saveAudioFile: (buffer: Buffer) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type { ElectronAPI, RecordingData, RecordingResult, TranscriptionResult, SaveResult };

