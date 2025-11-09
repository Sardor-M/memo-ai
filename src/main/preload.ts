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


  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),


  minimizeRecordingWidget: () => ipcRenderer.invoke('minimize-recording-widget'),
  closeRecordingWidget: () => ipcRenderer.invoke('close-recording-widget'),

  getRecordings: () => ipcRenderer.invoke('get-recordings'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  fetchCalendarEvents: () => ipcRenderer.invoke('fetch-calendar-events'),
  createCalendarEvent: (payload: { title: string; start: string; end: string; location?: string }) =>
    ipcRenderer.invoke('create-calendar-event', payload),
  summarizeWithOpenAI: (payload: {
    transcript: string;
    notes?: string;
    summaryType?: 'bullets' | 'headline' | 'paragraph';
  }) => ipcRenderer.invoke('summarize-with-openai', payload),

  onRecordingStateChange: (callback: (state: any) => void) => {
    ipcRenderer.on('recording-state-changed', (_event, state) => callback(state));
  },

  openMicrophoneSettings: () => ipcRenderer.invoke('open-microphone-settings'),
  openCameraSettings: () => ipcRenderer.invoke('open-camera-settings'),
});