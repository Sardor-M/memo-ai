import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Widget functions
  showWidget: () => ipcRenderer.invoke('show-widget'),
  hideWidget: () => ipcRenderer.invoke('hide-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget'),

  // Recording functions
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),

   transcribeBuffer: (buffer: Buffer) => {
    console.log("Transcribe buffer called");
    return ipcRenderer.invoke("transcribe-buffer", buffer);
  },

  saveAudioFile: (buffer: Buffer) => ipcRenderer.invoke("save-audio-file", buffer),
  saveToDocx: (content: string, filename: string) =>
    ipcRenderer.invoke('save-to-docx', content, filename),

  // Window control functions
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Recording widget control functions
  minimizeRecordingWidget: () => ipcRenderer.invoke('minimize-recording-widget'),
  closeRecordingWidget: () => ipcRenderer.invoke('close-recording-widget'),

  // Utility functions
  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

 
  // Widget state sync
  onRecordingStateChange: (callback: (state: any) => void) => {
    ipcRenderer.on('recording-state-changed', (_event, state) => callback(state));
  },
});