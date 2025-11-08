# Memo-AI

A lightweight desktop application for recording audio, taking notes, and saving transcripts.

## Features

- Voice recording with real-time waveform visualization
- Live note-taking during recording
- Real-time transcript display
- Auto-save to local machine (~/Documents/Memo-AI/)
- Clean, minimal design
- Smooth animations

## Quick Start

```bash
npm install
npm start
```

## How to Use

1. Click "New Recording" to open the recording widget
2. Click "Start" to begin recording
3. Switch to "Notes" tab to add notes
4. View live transcript in "Transcript" tab
5. Click "Stop" to end recording
6. Click "Save" to save recording to ~/Documents/Memo-AI/

## Recording Widget

The recording widget includes:
- Start/Stop/Pause buttons
- Notes editor
- Live transcript display
- Dynamic waveform animation
- Real-time status indicators
- Save functionality

## File Saving

Recordings are saved to: `~/Documents/Memo-AI/memo-{timestamp}.txt`

Format includes:
- Recording date and time
- Duration
- Full transcript
- Your notes

## Tech Stack

- Electron
- React
- TypeScript
- Tailwind CSS
- Vite

## Project Status

Production ready - all features implemented and tested.
