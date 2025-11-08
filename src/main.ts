import { app, BrowserWindow, ipcMain, systemPreferences, Tray, Menu, nativeImage, NativeImage } from 'electron';
import path from 'path';

const loadEnvironment = () => {
    try {
        const fs = require('fs');
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            return;
        }
        const raw = fs.readFileSync(envPath, 'utf8');
        raw.split(/\r?\n/).forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                return;
            }
            const [key, ...rest] = trimmed.split('=');
            if (!key) {
                return;
            }
            const value = rest
                .join('=')
                .trim()
                .replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        });
    } catch {}
};

loadEnvironment();

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;
let recordingWidgetWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Declare Vite dev server URL
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const MAIN_WINDOW_VITE_PRELOAD_URL: string;

// Request permissions for macOS
async function requestPermissions() {
    if (process.platform === 'darwin') {
        try {
            console.log('📱 Requesting macOS permissions...');

            // Request microphone permission
            const micStatus = await systemPreferences.askForMediaAccess('microphone');
            console.log('🎤 Microphone permission:', micStatus ? 'Granted' : 'Denied');

            // Request camera permission
            const cameraStatus = await systemPreferences.askForMediaAccess('camera');
            console.log('📹 Camera permission:', cameraStatus ? 'Granted' : 'Denied');

            // Notify renderer of permission status
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('permissions-updated', {
                    microphone: micStatus,
                    camera: cameraStatus,
                });
            }
        } catch (error) {
            console.error('Permission request failed:', error);
        }
    } else if (process.platform === 'win32') {
        console.log('💻 Windows detected - permissions handled by system');
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

function createWidgetWindow() {
    widgetWindow = new BrowserWindow({
        width: 400,
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
        widgetWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
            hash: '/widget',
        });
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
        width: 450,
        height: 700,
        minWidth: 350,
        minHeight: 500,
        maxWidth: 800,
        maxHeight: 1200,
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

    // Load recording widget using the same entry point but with hash route to /recording-widget
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        recordingWidgetWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/recording-widget`);
        recordingWidgetWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        recordingWidgetWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
            hash: '/recording-widget',
        });
    }

    // Position in bottom-right corner with safe margins
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Leave 20px margin from right and bottom
    recordingWidgetWindow.setPosition(width - 420, height - 620);

    recordingWidgetWindow.on('closed', () => {
        recordingWidgetWindow = null;
    });
}

// Create Tray Icon
function createTray() {
    // Create tray icon - supports both macOS menu bar and Windows system tray
    const fs = require('fs');
    const isMac = process.platform === 'darwin';

    // Detect if running in development mode
    const isDev = MAIN_WINDOW_VITE_DEV_SERVER_URL !== undefined;
    console.log(`🔍 Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);

    // Try multiple paths to find memo.png
    const potentialPaths = [
        // Development paths (when running from src/)
        path.join(__dirname, '../assets/memo.png'), // src/main.ts -> ../assets/memo.png
        path.join(__dirname, './assets/memo.png'), // src/main.ts -> ./assets/memo.png
        path.join(__dirname, '../../src/assets/memo.png'), // dist/main.js -> ../../src/assets/memo.png
        path.join(app.getAppPath(), 'src/assets/memo.png'), // app path based
        path.join(process.cwd(), 'src/assets/memo.png'), // cwd when running npm start
        path.join(process.cwd(), 'assets/memo.png'),
        // Production paths
        path.join(__dirname, './assets/memo.png'), // dist/assets/memo.png
    ];

    let iconPath: string | null = null;

    // Find the first path that exists
    for (const tryPath of potentialPaths) {
        if (fs.existsSync(tryPath)) {
            iconPath = tryPath;
            console.log(`✅ Found memo.png at: ${tryPath}`);
            break;
        }
    }

    if (!iconPath) {
        console.warn(`⚠️ memo.png not found in any location`);
        console.warn(`Tried paths:`);
        potentialPaths.forEach((p) => console.warn(`  - ${p}`));

        // Create minimal PNG fallback
        const trayPngPath = path.join(__dirname, '../assets/tray-icon.png');
        const assetsDir = path.dirname(trayPngPath);

        // Create assets directory if needed
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        if (!fs.existsSync(trayPngPath)) {
            try {
                // Create a minimal valid PNG (1x1 transparent pixel)
                const minimalPng = Buffer.from([
                    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
                    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
                    0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
                    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
                    0x42, 0x60, 0x82,
                ]);
                fs.writeFileSync(trayPngPath, minimalPng);
                console.log(`✅ Created fallback tray icon at: ${trayPngPath}`);
                iconPath = trayPngPath;
            } catch (error) {
                console.warn('⚠️ Failed to create fallback tray icon:', error);
                console.warn('⚠️ Tray will use default system icon');
            }
        } else {
            iconPath = trayPngPath;
            console.log(`✅ Using existing fallback PNG: ${trayPngPath}`);
        }
    }

    // Create tray with icon (or without if no path found)
    try {
        let trayImage: NativeImage | null = null;

        if (iconPath) {
            const loaded = nativeImage.createFromPath(iconPath);
            if (!loaded.isEmpty()) {
                const size = isMac ? { width: 18, height: 18 } : { width: 24, height: 24 };
                trayImage = loaded.resize({ ...size, quality: 'best' });
                if (isMac) {
                    trayImage.setTemplateImage(true);
                }
            } else {
                console.warn('⚠️ Loaded tray image is empty.');
            }
        }

        if (trayImage) {
            console.log('🎙️ Creating tray icon from native image');
            tray = new Tray(trayImage);
        } else if (iconPath) {
            console.log(`🎙️ Creating tray icon directly from path: ${iconPath}`);
            tray = new Tray(iconPath);
        } else {
            console.log('🎙️ Creating tray without icon (system default)');
            tray = new Tray(nativeImage.createEmpty());
        }

        if (tray && isMac) {
            tray.setIgnoreDoubleClickEvents(true);
        }

        console.log('✅ Tray icon created successfully');
    } catch (error) {
        console.error('❌ Failed to create tray:', error);
        return;
    }

    // Set tooltip
    tray.setToolTip('Memo-AI - Click to open recording widget');

    // Build context menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Recording Widget',
            click: () => {
                createRecordingWidgetWindow();
            },
        },
        {
            label: 'Show Main Window',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                    mainWindow.webContents.send('navigate', '/settings');
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Quit Memo-AI',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);

    // Click on tray icon to toggle recording widget window
    tray.on('click', () => {
        if (recordingWidgetWindow && !recordingWidgetWindow.isDestroyed()) {
            if (recordingWidgetWindow.isVisible()) {
                recordingWidgetWindow.hide();
            } else {
                recordingWidgetWindow.show();
                recordingWidgetWindow.focus();
            }
        } else {
            createRecordingWidgetWindow();
        }
    });

    // Right-click shows context menu automatically on Windows/Linux
    // On macOS, left-click shows context menu and right-click shows it too
}

// App lifecycle
app.whenReady().then(async () => {
    await requestPermissions();
    createMainWindow();
    createTray();

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

ipcMain.handle('select-directory', async () => {
    const browser = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const options: Electron.OpenDialogOptions = {
        title: 'Select folder for Memo-AI exports',
        properties: ['openDirectory', 'createDirectory'],
    };

    const result = browser ? await dialog.showOpenDialog(browser, options) : await dialog.showOpenDialog(options);

    return {
        canceled: result.canceled,
        path: result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0],
    };
});

ipcMain.handle('fetch-calendar-events', async () => {
    if (process.platform !== 'darwin') {
        return { success: false, error: 'Calendar import is only available on macOS.' };
    }

    const jxaScript = `
      const app = Application.currentApplication();
      app.includeStandardAdditions = true;

      const calendarApp = Application('Calendar');
      const startWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endWindow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const events = [];

      function extractEvents(calendar) {
        const calEvents = calendar.events.whose({
          _and: [
            { startDate: { '>=': startWindow } },
            { startDate: { '<=': endWindow } }
          ]
        })();

        calEvents.forEach(function(event) {
          const start = event.startDate();
          if (!start) { return; }
          const end = event.endDate() || start;
          events.push({
            id: event.uid() || event.id() || (event.summary() + '-' + start.toISOString()),
            calendar: calendar.name() || 'Calendar',
            title: event.summary() || 'Untitled event',
            start: start.toISOString(),
            end: end.toISOString(),
            location: event.location() || '',
            notes: event.description() || ''
          });
        });
      }

      calendarApp.calendars().forEach(extractEvents);

      JSON.stringify(events);
`;

    return new Promise((resolve) => {
        execFile('/usr/bin/osascript', ['-l', 'JavaScript', '-e', jxaScript], (error, stdout, stderr) => {
            if (error) {
                const message = error.message?.includes('-1743')
                    ? 'Memo-AI is not permitted to access Calendar. Grant Calendar access in System Settings > Privacy & Security > Calendars.'
                    : stderr?.trim() || error.message;
                resolve({ success: false, error: message });
                return;
            }

            try {
                const parsed = stdout ? JSON.parse(stdout) : [];
                const normalized = Array.isArray(parsed)
                    ? parsed
                          .map((event) => {
                              if (!event || !event.start) {
                                  return null;
                              }
                              return {
                                  id: event.id || `${event.title ?? 'event'}-${event.start}`,
                                  calendar: event.calendar || 'Calendar',
                                  title: event.title || 'Untitled event',
                                  start: event.start,
                                  end: event.end || event.start,
                                  location: event.location || '',
                                  notes: event.notes || '',
                              };
                          })
                          .filter(Boolean)
                          .sort((a, b) => new Date(a!.start).getTime() - new Date(b!.start).getTime())
                    : [];
                resolve({ success: true, events: normalized });
            } catch (parseError) {
                resolve({
                    success: false,
                    error: 'Failed to parse Calendar data. Please try again.',
                });
            }
        });
    });
});

ipcMain.handle(
    'create-calendar-event',
    async (_event, payload: { title: string; start: string; end: string; location?: string }) => {
        if (process.platform !== 'darwin') {
            return { success: false, error: 'Calendar event creation is only supported on macOS.' };
        }

        const fs = require('fs');
        const os = require('os');

        try {
            const { title, start, end, location = '' } = payload;
            const uid = `memo-ai-${Date.now()}@memo.ai`;

            const formatICSDate = (value: string) => {
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) {
                    throw new Error(`Invalid date: ${value}`);
                }
                return date
                    .toISOString()
                    .replace(/[-:]/g, '')
                    .replace(/\.\d{3}/, '');
            };

            const dtStart = formatICSDate(start);
            const dtEnd = formatICSDate(end);
            const dtStamp = formatICSDate(new Date().toISOString());

            const lines = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Memo-AI//Calendar Integration//EN',
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${dtStamp}`,
                `DTSTART:${dtStart}`,
                `DTEND:${dtEnd}`,
                `SUMMARY:${title}`,
                location ? `LOCATION:${location}` : null,
                'END:VEVENT',
                'END:VCALENDAR',
                '',
            ].filter(Boolean);

            const tmpPath = os.tmpdir() + `/memo-ai-event-${Date.now()}.ics`;
            fs.writeFileSync(tmpPath, lines.join('\n'), 'utf8');
            await shell.openPath(tmpPath);

            return { success: true, path: tmpPath };
        } catch (error) {
            console.error('Failed to create calendar event', error);
            return { success: false, error: (error as Error).message };
        }
    },
);

ipcMain.removeHandler('summarize-with-openai');

ipcMain.handle(
    'summarize-with-openai',
    async (
        _event,
        payload: { transcript: string; notes?: string; summaryType?: 'bullets' | 'headline' | 'paragraph' },
    ) => {
        const { transcript, notes, summaryType = 'bullets' } = payload ?? {};
        const apiKey = process.env.MEMO_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { success: false, error: 'OpenAI API key is not configured.' };
        }

        const endpoint =
            process.env.MEMO_OPENAI_SUMMARY_URL ||
            process.env.OPENAI_SUMMARY_URL ||
            'https://api.openai.com/v1/responses';
        const model = process.env.MEMO_OPENAI_SUMMARY_MODEL || process.env.OPENAI_SUMMARY_MODEL || 'gpt-4.1-mini';

        if (!transcript?.trim()) {
            return { success: false, error: 'Transcript is empty.' };
        }

        try {
            const prompts: Record<string, string> = {
                bullets:
                    'Provide a concise bullet list summarizing the transcript. Keep each bullet short and actionable.',
                headline: 'Write a single-sentence headline that captures the primary takeaway of the transcript.',
                paragraph:
                    'Write a short paragraph (3-4 sentences) summarizing the key details and outcomes from the transcript.',
            };

            const prompt =
                prompts[summaryType] ??
                'Provide a concise bullet list summarizing the transcript. Keep each bullet short and actionable.';

            const systemInstruction = [
                'You are Memo-AI, a concise meeting summarizer.',
                'Follow the requested format (bullets, headline, or paragraph).',
                'Base your summary strictly on the provided transcript and optional notes.',
            ].join(' ');

            const userSections: string[] = [prompt, '', 'Transcript:', '"""', transcript.trim(), '"""'];

            if (notes?.trim()) {
                userSections.push('', 'Additional Notes:', '"""', notes.trim(), '"""');
            }

            const userPrompt = userSections.join('\n');

            const extractText = (value: any): string => {
                if (!value) return '';
                if (typeof value === 'string') return value;
                if (typeof value === 'object') {
                    if (typeof value.output_text === 'string') return value.output_text;
                    if (typeof value.input_text === 'string') return value.input_text;
                    if (typeof value.text === 'string') return value.text;
                    if (Array.isArray(value.content)) {
                        return value.content.map(extractText).join('');
                    }
                }
                if (Array.isArray(value)) {
                    return value.map(extractText).join('');
                }
                return '';
            };

            const callOpenAI = async (maxTokens: number) => {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        input: [
                            {
                                role: 'system',
                                content: [
                                    {
                                        type: 'input_text',
                                        text: systemInstruction,
                                    },
                                ],
                            },
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'input_text',
                                        text: userPrompt,
                                    },
                                ],
                            },
                        ],
                        max_output_tokens: maxTokens,
                    }),
                });

                const raw = await response.text();
                let data: any = null;

                try {
                    data = raw ? JSON.parse(raw) : null;
                } catch {
                    data = null;
                }

                return { response, raw, data };
            };

            const baseMaxTokens = summaryType === 'headline' ? 200 : summaryType === 'paragraph' ? 900 : 700;
            let maxTokens = baseMaxTokens;

            for (let attempt = 0; attempt < 3; attempt += 1) {
                const { response, raw, data } = await callOpenAI(maxTokens);

                if (!response.ok) {
                    const message =
                        data?.error?.message ||
                        data?.error ||
                        data?.message ||
                        data?.detail ||
                        (raw ? raw.trim() : `OpenAI summary request failed with status ${response.status}.`);
                    return { success: false, error: message };
                }

                let summary = '';

                if (typeof data?.output_text === 'string') {
                    summary = data.output_text.trim();
                } else if (Array.isArray(data?.output_text)) {
                    summary = data.output_text.map(extractText).join('\n').trim();
                } else if (Array.isArray(data?.output)) {
                    summary = data.output.map(extractText).join('\n').trim();
                } else if (Array.isArray(data?.content)) {
                    summary = data.content.map(extractText).join('\n').trim();
                } else if (data?.response) {
                    summary = extractText(data.response).trim();
                } else if (typeof data === 'string') {
                    summary = data.trim();
                }

                if (summary) {
                    return { success: true, summary };
                }

                const incompleteReason = data?.incomplete_details?.reason || data?.reason;
                if (data?.status === 'incomplete' && incompleteReason === 'max_output_tokens') {
                    maxTokens = Math.min(maxTokens + 400, 2000);
                    continue;
                }

                return { success: false, error: 'OpenAI summary response was empty.' };
            }

            return { success: false, error: 'OpenAI summary response was empty after multiple attempts.' };
        } catch (error) {
            console.error('Failed to summarize transcript with OpenAI:', error);
            return { success: false, error: (error as Error).message };
        }
    },
);

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

ipcMain.handle('transcribe-audio', async (event, audioPath: string) => {
    console.log('Transcribe audio called:', audioPath);
    return { success: true, transcript: 'Sample transcript text' };
});

ipcMain.handle('save-to-docx', async (event, content: string, filename: string) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        // Get the Documents folder or Desktop on macOS
        const documentsPath = path.join(os.homedir(), 'Documents', 'Memo-AI');

        // Create directory if it doesn't exist
        if (!fs.existsSync(documentsPath)) {
            fs.mkdirSync(documentsPath, { recursive: true });
        }

        // Save the file
        const filepath = path.join(documentsPath, filename);
        fs.writeFileSync(filepath, content, 'utf-8');

        console.log('✅ Saved to:', filepath);

        // Open the file location in Finder (macOS)
        if (process.platform === 'darwin') {
            const { shell } = require('electron');
            shell.showItemInFolder(filepath);
        }

        return { success: true, path: filepath };
    } catch (error) {
        console.error('❌ Failed to save:', error);
        return { success: false, error: (error as Error).message };
    }
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

// Sync recording state with widget
ipcMain.on('recording-state-updated', (event, state) => {
    if (recordingWidgetWindow) {
        recordingWidgetWindow.webContents.send('recording-state-changed', state);
    }
});

// System settings handlers for opening Privacy settings
ipcMain.handle('open-microphone-settings', async () => {
    try {
        const { shell } = require('electron');
        if (process.platform === 'darwin') {
            // Open macOS System Settings to Privacy & Security > Microphone
            shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
            console.log('✅ Opening macOS Microphone Settings');
        } else if (process.platform === 'win32') {
            // Open Windows Settings to Privacy
            shell.openExternal('ms-settings:privacy-microphone');
            console.log('✅ Opening Windows Microphone Settings');
        }
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to open microphone settings:', error);
        return { success: false, error: error };
    }
});

ipcMain.handle('open-camera-settings', async () => {
    try {
        const { shell } = require('electron');
        if (process.platform === 'darwin') {
            // Open macOS System Settings to Privacy & Security > Camera
            shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Camera');
            console.log('✅ Opening macOS Camera Settings');
        } else if (process.platform === 'win32') {
            // Open Windows Settings to Privacy
            shell.openExternal('ms-settings:privacy-webcam');
            console.log('✅ Opening Windows Camera Settings');
        }
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to open camera settings:', error);
        return { success: false, error: error };
    }
});
