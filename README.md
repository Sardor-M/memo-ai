# Memo-AI

Memo-AI is an Electron desktop workspace built to capture meetings end-to-end: record audio, take live notes, generate transcripts with AssemblyAI, and sync action items back to macOS Calendar.

---

## Capabilities at a glance

- **Recording control** – Launch the floating widget from the dashboard or calendar, then start, pause, and stop sessions without leaving the app.
- **Live transcript & notes** – AssemblyAI streaming keeps the transcript view and the notes editor up to date while you type.
- **Calendar integration** – Import events from macOS Calendar, create new meetings from the Schedule view, or jump into a meeting link directly.
- **AI assistance** – Generate daily plans, meeting summaries, or suggested agendas using OpenAI’s Responses API.
- **Structured exports** – Every session is saved to `~/Documents/Memo-AI/` with timestamped summaries, transcript text, and the notes you captured.

---

## Requirements

- Node.js 18 or later
- macOS (Calendar sync depends on macOS automation)
- A `.env` file in the project root containing:
  ```bash
  MEMO_OPENAI_API_KEY=sk-...
  MEMO_OPENAI_SUMMARY_MODEL=gpt-4.1-mini
  VITE_ASSEMBLY_AI_KEY=your-assemblyai-key
  # Optional overrides
  MEMO_OPENAI_SUMMARY_URL=https://api.openai.com/v1/responses
  ```
  Never commit real keys—GitHub push protection will block any secret that lands in history.

---

## Getting started

Install dependencies and run in development mode:

```bash
npm install
npm run dev
```

This launches the Vite-powered renderer with hot reload and opens the Electron main window.

---

## Build for distribution

```bash
npm run build     # bundles renderer + main
npm run make      # produces platform-specific artifacts via Electron Forge
```

The packaged app icon is pulled from `src/assets/memo.png` (configured in `forge.config.ts`). Tray icons are generated through `create-tray-icon.js`.

---

## Project structure

| Path                                   | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `src/main.ts`                          | Electron main process, IPC handlers, Calendar + OpenAI bridge  |
| `src/main/preload.ts`                  | API surface exposed safely to the renderer                     |
| `src/renderer/pages/*`                 | React routes (Dashboard, History, Schedule, Calendar, Settings)|
| `src/renderer/windows/RecordingWidget` | Floating recording/transcript widget                           |
| `src/renderer/hooks/useAssemblyAI.ts`  | WebSocket streaming hook to AssemblyAI                         |
| `src/utils/calendar.ts`                | Local-storage helpers, accent assignment for events            |

---

## Typical workflow

1. Review the Schedule page for upcoming meetings or add one via “Add meeting”.
2. When a meeting starts, click **Start** to open the recording widget and begin capturing.
3. Capture live notes and monitor the transcript; generate summaries or AI suggestions as needed.
4. Stop and save—Memo-AI writes the session to disk, updates history, and stores the event locally.

---