/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare global {
  interface Window {
    electronAPI: {
      // Recording functions
      startRecording: () => Promise<{ success: boolean; audioPath?: string }>;
      stopRecording: () => Promise<{ success: boolean; audioPath?: string }>;
      transcribeAudio: (audioPath: string) => Promise<{ success: boolean; transcript?: string }>;
      saveToDocx: (content: string, filename: string) => Promise<{ success: boolean }>;
      
      // Widget functions
      hideWidget: () => void;
      onRecordingProgress: (callback: (data: { duration: number; status: string }) => void) => void;
      
      // Window control functions
      minimizeWindow?: () => Promise<void>;
      maximizeWindow?: () => Promise<void>;
      closeWindow?: () => Promise<void>;
      
      // Utility
      getRecordings?: () => Promise<any[]>;
      getAppPath?: () => Promise<string>;
    };
  }
}
