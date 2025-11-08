/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

declare global {
  interface Window {
    electronAPI: {
      startRecording: () => Promise<{ success: boolean; audioPath?: string }>;
      stopRecording: () => Promise<{ success: boolean; audioPath?: string }>;
      transcribeAudio: (audioPath: string) => Promise<{ success: boolean; transcript?: string }>;
      saveToDocx: (content: string, filename: string) => Promise<{ success: boolean }>;
      hideWidget: () => void;
      onRecordingProgress: (callback: (data: { duration: number; status: string }) => void) => void;
    };
  }
}
