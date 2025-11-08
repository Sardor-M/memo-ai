# AI Agent Guidelines - Memo-AI Project

## Project Overview
**Memo-AI** is an Electron + React + TypeScript desktop application for recording, transcribing, and managing meeting transcripts.

---

## Critical Rules (DO NOT BREAK)

### DO NOT CHANGE
- **Package.json versions** - Keep all dependency versions locked as-is
- **Node/Electron versions** - Do not upgrade without explicit approval
- **Environment configuration** - Do not modify `.env` setup
- **IPC handlers** - Do not remove existing handlers, only extend
- **Folder structure** - Maintain current hierarchy

### BE CAUTIOUS WITH
- **Type definitions** - Keep `forge.env.d.ts` in sync with preload.ts
- **Router configuration** - Routes must be in `src/renderer/routes/routes.ts`
- **Vite configs** - Main/preload configs must have proper build settings
- **Imports** - Use correct relative paths and aliases

---

## Folder Structure (DO NOT DEVIATE)

```
memo-ai/
├── src/
│   ├── main.ts                 # Electron main process
│   ├── main/
│   │   └── preload.ts          # IPC bridge
│   └── renderer/
│       ├── App.tsx             # Clean component (just CSS import)
│       ├── App.css             # Tailwind + global styles
│       ├── index.tsx           # Router setup & React rendering
│       ├── routes/
│       │   ├── routes.tsx      # ← ALL ROUTES HERE
│       │   ├── protectedRoute.tsx
│       │   └── publicRoute.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   └── Home.tsx
│       ├── components/
│       │   ├── Widget/
│       │   ├── Sidebar.tsx
│       │   └── ...
│       └── types/
│           └── electron.d.ts
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.main.config.ts
├── vite.preload.config.ts
├── vite.renderer.config.ts
├── forge.config.ts
└── package.json
```

---

## 🔄 Routing Standards

### Router Setup
- **Entry Point**: `src/renderer/index.tsx` (DO NOT MOVE)
- **All Routes**: `src/renderer/routes/routes.ts` (CENTRALIZED)
- **HTML Entry**: Points to `index.tsx` (NOT App.tsx)

### Route Definition
```typescript
// In routes/routes.tsx
export const routes: RouteObject[] = [
  { path: '/', element: <Dashboard /> },
  { path: '/widget', element: <Widget /> },
  { path: '*', element: <NotFound /> },
];
```

### App.tsx Must Be Clean
```typescript
// ✅ CORRECT - Just CSS import
import './App.css';

// ❌ WRONG - No Router/Routes logic here!
```

---

## 🎨 Styling & Tailwind

### CSS Files
- **Global**: `src/renderer/App.css` (Tailwind imports + global styles)
- **Component**: Keep component CSS alongside components
- **Tailwind**: Configured in `tailwind.config.js`

### Tailwind Setup
```tsx
// src/renderer/App.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🔌 Electron IPC Communication

### Current Handlers (in main.ts)
- `show-widget` - Show recording widget
- `hide-widget` - Hide recording widget
- `close-widget` - Close recording widget
- `start-recording` - Start audio recording
- `stop-recording` - Stop audio recording
- `transcribe-audio` - Transcribe audio file
- `save-to-docx` - Save transcript to Word
- `get-recordings` - Get recordings list
- `get-app-path` - Get app data path

### Preload API (in forge.env.d.ts)
```typescript
window.electronAPI.{
  showWidget()
  hideWidget()
  closeWidget()
  startRecording()
  stopRecording()
  transcribeAudio(path)
  saveToDocx(content, filename)
  getRecordings()
  getAppPath()
}
```

### Using IPC in Components
```typescript
// ✅ CORRECT
const result = await window.electronAPI.startRecording();

// ❌ WRONG - Don't add new methods without updating types
```

---

## 📦 Dependencies

### Current Versions (LOCKED)
- React: 19.2.0
- React-Router: 6.20.0
- Tailwind: 3.4.0
- Electron: 39.1.1
- Vite: 5.4.21
- TypeScript: 4.5.4

### Before Adding Packages
1. Ask if it's truly needed
2. Check if similar functionality exists
3. Keep bundle size minimal
4. Never change existing versions

---

## 🧪 Code Standards

### TypeScript
- Use strict mode (already enabled)
- Define types explicitly (no `any` unless necessary)
- Use interfaces for API responses
- Props must be typed

### React
- Use functional components only
- Hooks: useState, useEffect, useContext, etc.
- No class components
- Memoize expensive computations

### File Naming
```
❌ dashboardPage.tsx
✅ Dashboard.tsx

❌ useRecordingHook.ts
✅ useRecording.ts

❌ recordingType.ts
✅ types.ts or Recording.types.ts
```

### Import Paths
```typescript
// ✅ PREFERRED
import Dashboard from '../pages/Dashboard';

// ✅ ALSO OK (if alias set in vite)
import { Dashboard } from '@renderer/pages';

// ❌ AVOID
import { default as Dashboard } from '../pages/Dashboard';
```

---

## 🚀 Build & Run Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Linting
npm run lint

# Package
npm run package

# Make installers
npm run make
```

---

## 🔧 When Making Changes

### Before Modifying
1. ✅ Check current folder structure
2. ✅ Verify TypeScript types are correct
3. ✅ Ensure imports use correct paths
4. ✅ Run `npm run lint` to check code

### Adding New Features
1. Create components in `src/renderer/components/`
2. Create pages in `src/renderer/pages/`
3. Add routes to `src/renderer/routes/routes.tsx`
4. Update type definitions if needed
5. Test with `npm start`

### Adding New Routes
```typescript
// In src/renderer/routes/routes.tsx
{
  path: '/new-page',
  element: <NewPage />,
},
```

---

## ⚠️ Common Mistakes to Avoid

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Routes in App.tsx | Routes in routes/routes.tsx |
| Import CSS in index.tsx | Import CSS in App.tsx |
| Add to package.json versions | Keep versions locked |
| Store state in window | Use React Context/State |
| Direct DOM manipulation | Use React state |
| async imports in routes | Use React.lazy() |
| Hard-coded paths | Use relative paths |

---

## 🐛 Debugging Tips

### Build Hangs
```bash
# Clear Vite cache
rm -rf node_modules/.vite .vite

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Try again
npm start
```

### Type Errors
- Check `forge.env.d.ts` matches preload.ts
- Verify component props are typed
- Ensure imports are correct

### IPC Not Working
- Check handler name matches invoke call
- Verify preload.ts exposes the method
- Check BrowserWindow has preload configured

---

## 📚 File Edit Rules

### ALWAYS DO
- ✅ Keep comments explaining WHY (not WHAT)
- ✅ Maintain consistent indentation (2 spaces)
- ✅ Use TypeScript types
- ✅ Test changes before suggesting

### NEVER DO
- ❌ Change package.json versions
- ❌ Remove imports without checking usage
- ❌ Move files without updating imports
- ❌ Add console.logs in production code
- ❌ Use `any` type excessively

---

## 🎯 Project Goals

This project should:
- ✅ Record meeting audio
- ✅ Transcribe audio to text
- ✅ Save transcripts to documents
- ✅ Manage recording history
- ✅ Be lightweight & fast
- ✅ Run on macOS/Windows/Linux

---

## 📞 Questions?

If uncertain about:
- Package updates → Ask first
- Architecture changes → Ask first
- File moves → Ask first
- Anything else → Check this guide first

---

**Last Updated**: November 2024
**Status**: Production Ready ✅

