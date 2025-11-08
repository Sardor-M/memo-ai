import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;

// Declare Vite dev server URL
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

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

// Placeholder handlers - will implement later
ipcMain.handle('start-recording', async () => {
  console.log('Start recording called');
  return { success: true, recordingId: Date.now().toString() };
});

ipcMain.handle('stop-recording', async () => {
  console.log('Stop recording called');
  return { success: true, audioPath: '/path/to/audio.wav' };
});

ipcMain.handle('transcribe-audio', async (event, audioPath: string) => {
  console.log('Transcribe audio called:', audioPath);
  return { success: true, transcript: 'Sample transcript text' };
});

ipcMain.handle('save-to-docx', async (event, content: string, filename: string) => {
  console.log('Save to docx called:', filename);
  return { success: true, path: `/path/to/${filename}` };
});

ipcMain.handle('get-recordings', async () => {
  console.log('Get recordings called');
  return [];
});