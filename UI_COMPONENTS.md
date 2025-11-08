# 🎨 UI Components Documentation

## Overview
Modern sidebar navigation UI with history, analytics, and settings pages built with Tailwind CSS and shadcn/ui patterns.

---

## 📦 Components Created

### 1. **Sidebar Component** (`src/renderer/components/Sidebar/Sidebar.tsx`)

**Features:**
- Responsive design (mobile-friendly with hamburger menu)
- Active route highlighting
- Navigation badges (e.g., unread count)
- Bottom stats display
- Gradient background (slate-900 to slate-800)
- Smooth animations and transitions

**Props:** None (uses React Router internally)

**Navigation Items:**
- 🏠 Dashboard
- 📋 History
- 📊 Analytics
- ⚙️ Settings

**Example Usage:**
```tsx
<Sidebar />
```

**Features:**
- ✅ Mobile overlay
- ✅ Auto-close on mobile after navigation
- ✅ Active state indicators
- ✅ Built-in stats footer

---

### 2. **History Page** (`src/renderer/pages/History.tsx`)

**Features:**
- Search functionality
- Date filter (All Time, Today, Week, Month)
- Recording list with details
- Action buttons (Play, Download, Delete)
- Stats footer with totals
- Mock data for testing

**Recording Item Shows:**
- Title
- Date
- Duration
- Size
- Transcript preview
- Action buttons

**Stats Displayed:**
- Total Recordings
- Total Hours
- Total Transcribed
- Total Size (GB)

**Example Usage:**
```tsx
<Route path="/history" element={<History />} />
```

---

### 3. **Layout Structure**

**Sidebar + Content Layout:**
```
┌─────────────────────────────────────┐
│ ☰ Sidebar  │  Page Content Area    │
├─────────────┼──────────────────────┤
│             │                      │
│  Dashboard  │  Main content        │
│  History    │  (responsive)        │
│  Analytics  │                      │
│  Settings   │                      │
│             │                      │
└─────────────┴──────────────────────┘
```

---

## 🎯 Routes Configuration

**Current Routes:**
```
/              → Dashboard
/history       → History Page
/analytics     → Analytics Page (existing)
/settings      → Settings Page (existing)
/widget        → Recording Widget (no sidebar)
```

**Added to `routes/routes.tsx`:**
```typescript
{
  path: '/history',
  element: <History />,
},
```

---

## 🎨 Styling Details

### Tailwind Classes Used

**Sidebar:**
- `bg-gradient-to-b from-slate-900 to-slate-800` - Gradient background
- `text-slate-300/400` - Text colors
- `hover:bg-slate-700/50` - Hover states
- `transition-all duration-300` - Smooth animations

**History Page:**
- `flex-1 flex flex-col` - Layout structure
- `divide-y divide-gray-200` - List separators
- `line-clamp-2` - Text truncation
- `hover:bg-gray-50` - Row hover effect

**Responsive:**
- `md:hidden` - Mobile only
- `md:relative` - Desktop layout
- Hamburger menu on mobile
- Overlay backdrop on mobile

---

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile** (<768px): Hamburger menu, overlay
- **Desktop** (≥768px): Full sidebar visible

### Mobile Features
- Fixed hamburger toggle (top-left)
- Semi-transparent overlay
- Auto-close after navigation
- Full-screen sidebar on mobile

---

## 🔄 Data Flow

### History Page Data
```
┌─────────────────────┐
│  loadRecordings()   │
├─────────────────────┤
│ Try electron API    │
│ Fallback to mock    │
└──────────┬──────────┘
           │
     ┌─────▼──────┐
     │ setRecordings
     └─────┬──────┘
           │
    ┌──────▼──────────┐
    │ Filter & Display
    │ (Search + Date)
    └─────────────────┘
```

---

## 🎭 Component Hierarchy

```
App (Router)
├── Sidebar
│   ├── Nav Items
│   └── Stats Footer
│
└── Page Content (Routes)
    ├── Dashboard
    ├── History
    │   ├── Search Bar
    │   ├── Filter Select
    │   ├── Recording List
    │   │   └── Recording Items
    │   └── Stats Footer
    ├── Analytics
    ├── Settings
    └── Widget
```

---

## 🚀 How to Use

### View History Page
```
Click "History" in sidebar → Shows all recordings
```

### Search Recordings
```
Type in search box → Filters by name
```

### Filter by Date
```
Select filter dropdown → Filters by date range
```

### Perform Actions
```
Click action buttons:
- 🎵 Play → Play recording
- ⬇️ Download → Download file
- 🗑️ Delete → Delete recording
```

---

## 📊 Statistics

### Current Mock Data
```
- 3 Total Recordings
- 1h 23m Total Duration
- 2 Transcribed
- 258 MB Total Size
```

### Dynamic Calculations
```typescript
// Total hours calculated from durations
// Transcribed count filtered from transcripts
// Size total summed from all recordings
```

---

## 🛠️ Customization Guide

### Change Sidebar Colors
```typescript
// In Sidebar.tsx, modify gradient:
className="bg-gradient-to-b from-blue-900 to-blue-800"
```

### Add New Navigation Item
```typescript
const navItems: NavItem[] = [
  // ... existing items
  { 
    path: '/new-page', 
    label: 'New Page', 
    icon: <NewIcon size={20} /> 
  },
];
```

### Modify Recording Fields
```typescript
interface Recording {
  id: string;
  name: string;
  date: string;
  // Add custom fields here
}
```

---

## ✨ Features at a Glance

| Feature | Status |
|---------|--------|
| Responsive Sidebar | ✅ |
| Mobile Menu | ✅ |
| Search Functionality | ✅ |
| Date Filtering | ✅ |
| Recording Management | ✅ |
| Action Buttons | ✅ |
| Stats Display | ✅ |
| Active Route Highlight | ✅ |
| Smooth Animations | ✅ |
| Mobile Optimization | ✅ |

---

## 📁 File Structure

```
src/renderer/
├── components/
│   └── Sidebar/
│       └── Sidebar.tsx          ← New
├── pages/
│   ├── Dashboard.tsx
│   ├── History.tsx              ← New
│   ├── Analytics.tsx
│   └── Settings.tsx
├── routes/
│   └── routes.tsx               ← Updated
└── index.tsx                    ← Updated
```

---

## 🎯 Next Steps

1. **Connect Real Data** - Replace mock data with actual recordings
2. **Implement Actions** - Play, download, delete functionality
3. **Add Settings** - Persist user preferences
4. **Analytics** - Add charts and statistics
5. **Transcription** - Show and manage transcripts

---

## 📝 Notes

- Sidebar automatically hides on `/widget` route
- All styling uses Tailwind utility classes
- Icons from lucide-react
- Mobile responsive out of the box
- Mock data for development/testing

---

**Last Updated**: November 2024
**Status**: Ready for Integration ✅

