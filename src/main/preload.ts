import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Widget functions
  showWidget: () => ipcRenderer.invoke('show-widget'),
  hideWidget: () => ipcRenderer.invoke('hide-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget'),

  // Recording functions
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  transcribeAudio: (audioPath: string) =>
    ipcRenderer.invoke('transcribe-audio', audioPath),
  saveToDocx: (content: string, filename: string) =>
    ipcRenderer.invoke('save-to-docx', content, filename),

  // Window control functions
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Utility functions
  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});