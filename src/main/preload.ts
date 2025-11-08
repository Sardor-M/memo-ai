import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  showWidget: () => ipcRenderer.invoke('show-widget'),
  hideWidget: () => ipcRenderer.invoke('hide-widget'),
  closeWidget: () => ipcRenderer.invoke('close-widget'),


  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),

  transcribeAudio: (audioPath: string) =>
    ipcRenderer.invoke('transcribe-audio', audioPath),

  saveToDocx: (content: string, filename: string) =>
    ipcRenderer.invoke('save-to-docx', content, filename),
  getRecordings: () => ipcRenderer.invoke('get-recordings'),

  // System
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});