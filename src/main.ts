import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';
import path from 'path';

import fs from "fs/promises";
import os from "os";

import whisper from 'whisper-node';
import ffmpeg from 'ffmpeg-static';


//const whisper = require('whisper-node');

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;
let recordingWidgetWindow: BrowserWindow | null = null;

// Declare Vite dev server URL
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const MAIN_WINDOW_VITE_PRELOAD_URL: string;

// Request permissions for macOS
async function requestPermissions() {
  if (process.platform === 'darwin') {
    try {
      const micStatus = await systemPreferences.askForMediaAccess('microphone');
      console.log('Microphone permission:', micStatus);
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }
}

// Create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f7',
    show: false,
  });

  // Load the Vite dev server URL or the built file
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create widget window
function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    width: 320,
    height: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load widget route
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    widgetWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/widget`);
    widgetWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    widgetWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: '/widget' }
    );
  }

  // Position in bottom-right corner
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  widgetWindow.setPosition(width - 340, height - 470);

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

// Create separate recording widget window
function createRecordingWidgetWindow() {
  if (recordingWidgetWindow) {
    recordingWidgetWindow.focus();
    return;
  }

  recordingWidgetWindow = new BrowserWindow({
    width: 380,
    height: 500,
    frame: false,
    transparent: false,
    backgroundColor: '#111827',
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: true,
    movable: true,
    minimizable: true,
    closable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
  });

  // Load recording widget
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    recordingWidgetWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}recording-widget.html`);
    recordingWidgetWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    recordingWidgetWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/recording-widget.html`));
  }

  // Position in bottom-right corner
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  recordingWidgetWindow.setPosition(width - 400, height - 520);

  recordingWidgetWindow.on('closed', () => {
    recordingWidgetWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  await requestPermissions();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('show-widget', () => {
  if (!widgetWindow) {
    createWidgetWindow();
  } else {
    widgetWindow.show();
    widgetWindow.focus();
  }
  return { success: true };
});

ipcMain.handle('hide-widget', () => {
  if (widgetWindow) {
    widgetWindow.hide();
  }
  return { success: true };
});

ipcMain.handle('close-widget', () => {
  if (widgetWindow) {
    widgetWindow.close();
    widgetWindow = null;
  }
  return { success: true };
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Recording handlers with widget sync
ipcMain.handle('start-recording', async () => {
  console.log('Start recording called');
  
  // Create and show recording widget window
  createRecordingWidgetWindow();
  
  // Notify widget of recording start
  if (recordingWidgetWindow) {
    recordingWidgetWindow.webContents.send('recording-state-changed', { isRecording: true });
  }
  
  return { success: true, recordingId: Date.now().toString() };
});

ipcMain.handle('stop-recording', async () => {
  console.log('Stop recording called');
  return { success: true, audioPath: '/path/to/audio.wav' };
});

/*

ipcMain.handle('transcribe-audio', async (event, audioPath: string) => {
  console.log('Transcribe audio called:', audioPath);
  return { success: true, transcript: 'Sample transcript text' };
});

*/

ipcMain.handle('save-to-docx', async (event, content: string, filename: string) => {
  console.log('Save to docx called:', filename);
  return { success: true, path: `/path/to/${filename}` };
});

ipcMain.handle('get-recordings', async () => {
  console.log('Get recordings called');
  return [];
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Recording widget IPC handlers
ipcMain.handle('minimize-recording-widget', () => {
  if (recordingWidgetWindow) {
    recordingWidgetWindow.minimize();
  }
});

ipcMain.handle('close-recording-widget', () => {
  if (recordingWidgetWindow) {
    recordingWidgetWindow.close();
    recordingWidgetWindow = null;
  }
});




ipcMain.handle("transcribe-buffer", async (_, buffer: Buffer) => {
  try {
    const tempDir = app.getPath("temp");
    const audioPath = path.join(tempDir, `recording_${Date.now()}.webm`);
    await fs.writeFile(audioPath, Buffer.from(buffer));
    console.log("Audio saved:", audioPath);

    const result = await whisper(audioPath, {
      modelName: "base",
      whisperOptions: { language: "en" },
     // ffmpegPath: ffmpeg,
    });

    console.log("Whisper result:", result.text);
    await fs.unlink(audioPath);
    return result.text;
  } catch (err) {
    console.error("Whisper transcription error:", err);
    throw err;
  }
});


ipcMain.handle("save-audio-file", async (_, buffer: Buffer) => {
  const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.wav`);
  await fs.writeFile(tempPath, buffer);
  return tempPath;
});

// Sync recording state with widget
ipcMain.on('recording-state-updated', (event, state) => {
  if (recordingWidgetWindow) {
    recordingWidgetWindow.webContents.send('recording-state-changed', state);
  }
});