import { useState, useEffect, useRef, useMemo, } from 'react';
import { Volume2, Pause, Play, Save, Mic, AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAssemblyAI } from '../hooks/useAssemblyAI';
import { addHistoryEntry } from '../utils/history';
import { addCalendarEventEntry } from '../utils/calendar';

type SuggestedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  context: string;
};

const MONTH_MAP: Record<string, string> = {
  january: 'January',
  jan: 'January',
  february: 'February',
  feb: 'February',
  march: 'March',
  mar: 'March',
  april: 'April',
  apr: 'April',
  may: 'May',
  june: 'June',
  jun: 'June',
  july: 'July',
  jul: 'July',
  august: 'August',
  aug: 'August',
  september: 'September',
  sept: 'September',
  sep: 'September',
  october: 'October',
  oct: 'October',
  november: 'November',
  nov: 'November',
  december: 'December',
  dec: 'December',
};

const startFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const endFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

function capitalizeSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatEventRange(startISO: string, endISO: string) {
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return startISO;
  }
  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${startFormatter.format(startDate)} – ${endFormatter.format(endDate)}`;
  }
  return `${startFormatter.format(startDate)} → ${startFormatter.format(endDate)}`;
}

function extractEventsFromTranscript(transcript: string): SuggestedEvent[] {
  if (!transcript) return [];
  const suggestions: SuggestedEvent[] = [];
  const regex =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[\s]+(\d{1,2})(?:,?\s*(\d{4}))?(?:\s+(?:at|@)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?/gi;
  const now = new Date();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(transcript)) && suggestions.length < 4) {
    const rawMonth = match[1].toLowerCase().replace('.', '');
    const monthName = MONTH_MAP[rawMonth];
    if (!monthName) continue;

    const day = parseInt(match[2], 10);
    if (!Number.isFinite(day)) continue;

    const rawYear = match[3];
    let year = rawYear ? parseInt(rawYear, 10) : now.getFullYear();
    if (!Number.isFinite(year)) {
      year = now.getFullYear();
    }

    const timePortion = match[4] ? match[4].trim().replace(/\s+/g, ' ') : '9:00 AM';
    let startCandidate = new Date(`${monthName} ${day} ${year} ${timePortion}`);
    if (Number.isNaN(startCandidate.getTime())) {
      startCandidate = new Date(`${monthName} ${day}, ${year}`);
      if (Number.isNaN(startCandidate.getTime())) continue;
    }

    if (!rawYear && startCandidate.getTime() < now.getTime() - 60 * 60 * 1000) {
      startCandidate.setFullYear(year + 1);
    }

    const endCandidate = new Date(startCandidate.getTime() + 60 * 60 * 1000);
    const contextStart = Math.max(0, match.index - 60);
    const contextEnd = Math.min(transcript.length, match.index + match[0].length + 60);
    const rawContext = transcript.slice(contextStart, contextEnd).trim();
    const contextLine = rawContext.split(/[\n\.]/)[0] ?? match[0];
    const title = capitalizeSentence(contextLine.length > 0 ? contextLine : `Event on ${monthName} ${day}`);

    suggestions.push({
      id: `suggest-${match.index}-${startCandidate.getTime()}`,
      title,
      start: startCandidate.toISOString(),
      end: endCandidate.toISOString(),
      context: rawContext,
    });
  }

  return suggestions;
}

const ASSEMBLY_AI_KEY = import.meta.env.VITE_ASSEMBLY_AI_KEY ?? '';

export default function RecordingWidget() {
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'notes' | 'transcript'>('transcript');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notes, setNotes] = useState('');
  const [waveformBars, setWaveformBars] = useState(Array(60).fill(0));
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const [suggestedEvents, setSuggestedEvents] = useState<SuggestedEvent[]>([]);
  const [creatingEventId, setCreatingEventId] = useState<string | null>(null);
  const [createdEventIds, setCreatedEventIds] = useState<string[]>([]);
  const canCreateCalendarEvent = Boolean(window.electronAPI?.createCalendarEvent);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const {
    isConnected: isAIConnected,
    transcript,
    error: aiError,
    connect: connectAI,
    disconnect: disconnectAI,
    clearTranscript: clearAITranscript,
    clearError: clearAIError,
  } = useAssemblyAI({
    apiKey: ASSEMBLY_AI_KEY,
    onError: (error) => console.error('AI Error:', error),
  });

  useEffect(() => {
    window.electronAPI?.onRecordingStateChange?.((state: any) => {
      setIsRecording(state.isRecording);
      if (!state.isRecording) {
        setDuration(0);
        setIsPaused(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!transcript) {
      setSuggestedEvents([]);
      setCreatedEventIds([]);
      setSummaryText(null);
      setSummaryStatus('idle');
      setSummaryError(null);
      return;
    }
    setSuggestedEvents(extractEventsFromTranscript(transcript));
  }, [transcript]);

  useEffect(() => {
    if (!isRecording || isPaused) return;

    const waveInterval = setInterval(() => {
      setWaveformBars(prevBars => {
        const newBars = [...prevBars];
        // Shift bars to the left and add new bar on the right
        newBars.shift();
        // Add random height for new bar (0-100)
        const newHeight = Math.random() * 100;
        newBars.push(newHeight);
        return newBars;
      });
    }, 40); 

    return () => clearInterval(waveInterval);
  }, [isRecording, isPaused]);

  // Duration update every 1 second
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      if (!ASSEMBLY_AI_KEY) {
        alert('AssemblyAI API key is not configured. Add VITE_ASSEMBLY_AI_KEY to your environment to enable live transcription.');
        return;
      }
      clearAITranscript();
      clearAIError();
      setSummaryText(null);
      setSummaryStatus('idle');
      setSummaryError(null);
      
      await connectAI();
      await window.electronAPI?.startRecording?.();
      setIsRecording(true);
      setNotes('');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStop = async () => {
    try {
      disconnectAI();
      
      await window.electronAPI?.stopRecording?.();
      setIsRecording(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleCreateCalendarEvent = async (event: SuggestedEvent) => {
    if (!canCreateCalendarEvent) {
      alert('Calendar event creation is only available on macOS builds.');
      return;
    }

    try {
      setCreatingEventId(event.id);
      const response = await window.electronAPI?.createCalendarEvent?.({
        title: event.title,
        start: event.start,
        end: event.end,
        location: '',
      });

      if (!response || !response.success) {
        alert(response?.error ?? 'Memo-AI could not create the calendar event.');
        return;
      }

      addCalendarEventEntry({
        id: `memo-ai-${event.id}`,
        title: event.title,
        start: event.start,
        end: event.end,
        location: '',
        summary: event.context,
      });

      setCreatedEventIds(prev => (prev.includes(event.id) ? prev : [...prev, event.id]));
      alert('Event added to Calendar. Review the Calendar app to confirm.');
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      alert('Memo-AI could not create the calendar event.');
    } finally {
      setCreatingEventId(null);
    }
  };

  const handleSummarizeTranscript = async () => {
    if (!transcript) {
      return;
    }
  
    try {
      setSummaryStatus('loading');
      setSummaryError(null);
      
      const result = await window.electronAPI.summarizeWithOpenAI({
        transcript,
        notes,
        summaryType: 'bullets',
      });
  
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to generate summary.');
      }
  
      if (!result.summary || result.summary.trim() === '') {
        throw new Error('OpenAI returned an empty summary. Please try again.');
      }
  
      setSummaryText(result.summary);
      setSummaryStatus('ready');
    } catch (error) {
      console.error('Failed to summarize transcript:', error);
      setSummaryStatus('error');
      setSummaryError(error instanceof Error ? error.message : 'Unknown error while summarizing.');
    }
  };

  const handleDownloadSummary = () => {
    if (!summaryText) return;
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memo-summary-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const now = new Date();
      const docName = `memo-${now.getTime()}.txt`;
      const humanTimestamp = now.toLocaleString();
      const formattedDuration = formatTime(duration);
      const cleanTranscript = transcript.trim();
      const cleanNotes = notes.trim();

      const content = `=== Memo-AI Recording ===\nDate: ${humanTimestamp}\nDuration: ${formattedDuration}\n\n--- Transcript ---\n${cleanTranscript || 'No transcript captured.'}\n\n--- Notes ---\n${cleanNotes || 'No notes captured.'}`;
      const saveResult = await window.electronAPI?.saveToDocx?.(content, docName);
      if (saveResult && saveResult.success === false) {
        throw new Error(saveResult.error ?? 'Unable to save recording');
      }

      const baseTitleSource = cleanNotes || cleanTranscript;
      const title = baseTitleSource
        ? baseTitleSource.split(/\r?\n/)[0].slice(0, 80)
        : `Recording ${humanTimestamp}`;
      const summarySource = cleanTranscript || cleanNotes;
      const summary = summarySource
        ? (() => {
            const condensed = summarySource.replace(/\s+/g, ' ').trim();
            return condensed.length > 200 ? `${condensed.slice(0, 200)}…` : condensed;
          })()
        : 'No transcript available for this session.';

      addHistoryEntry({
        id: `history-${now.getTime()}`,
        title,
        createdAt: now.toISOString(),
        duration: formattedDuration,
        summary,
        transcript: cleanTranscript,
        notes: cleanNotes,
        filePath: saveResult?.path ?? (saveResult?.success ? docName : null),
      });

      clearAITranscript();
      setNotes('');
      setDuration(0);
      
      alert('Recording saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save recording');
    } finally {
      setIsSaving(false);
    }
  };

  const summaryListItems = useMemo(() => {
    if (!summaryText) return [];
    return summaryText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }, [summaryText]);

  return (
    <div 
      ref={dragRef}
      className="w-full h-full bg-gray-100 flex flex-col overflow-hidden select-none shadow-2xl rounded-lg border border-gray-200"
    >
      <div
        className="bg-gray-300 border-b border-gray-300 py-4"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 p-3 border-b border-gray-200 bg-gray-100">
        <div className="flex gap-2">
          <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white text-black border border-gray-300'
              : 'text-gray-600 hover:text-black hover:bg-gray-100 border border-transparent'
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          Notes
          </button>
          <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer ${
            activeTab === 'transcript'
              ? 'bg-white text-black border border-gray-300'
              : 'text-gray-600 hover:text-black hover:bg-gray-100 border border-transparent'
          }`}
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          Transcript
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700">
            <span className="text-gray-500">⏱</span>
            <span className="font-mono text-gray-800">{formatTime(duration)}</span>
          </div>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-md border ${isAIConnected ? 'border-green-300 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isAIConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {isAIConnected ? 'Transcripting...' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {activeTab === 'notes' ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="w-full h-full bg-gray-50 text-black text-xs rounded-lg p-3 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black/10 outline-none resize-none cursor-text"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            />
          ) : (
            <div className="space-y-3">
              {/* Waveform - Fast dynamic animation */}
              {isRecording && (
                <div className="flex items-end justify-center gap-0.5 h-12 bg-white rounded-lg p-2 border border-gray-200 overflow-hidden">
                  {waveformBars.map((height, i) => (
                    <div
                      key={i}
                      className="bg-black rounded-sm transition-none"
                      style={{
                        flex: '1 0 auto',
                        height: `${height}%`,
                        minHeight: '1px',
                        width: `${100 / waveformBars.length}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Error Display */}
              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs">{aiError}</p>
                </div>
              )}

              {/* Transcript Display */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 overflow-y-auto max-h-full">
                <div className="text-black text-xs leading-relaxed whitespace-pre-wrap">
                  {transcript ? (
                    <span>{transcript}</span>
                  ) : (
                    <span className="text-gray-500">🎙️ Recording started - transcript will appear here...</span>
                  )}
                </div>
              </div>

              {suggestedEvents.length > 0 && (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <CalendarIcon size={14} />
                    Suggested calendar events
                  </div>
                  {suggestedEvents.map((event) => {
                    const created = createdEventIds.includes(event.id);
                    const loading = creatingEventId === event.id;
                    return (
                      <div
                        key={event.id}
                        className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="flex items-center gap-1 text-gray-600">
                            <Clock size={12} />
                            {formatEventRange(event.start, event.end)}
                          </p>
                          {event.context && (
                            <p className="text-[11px] text-gray-500 italic">
                              “{event.context.length > 140 ? `${event.context.slice(0, 140)}…` : event.context}”
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCreateCalendarEvent(event)}
                          disabled={loading || created || !canCreateCalendarEvent}
                          className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                            created
                              ? 'border-emerald-400 bg-white text-emerald-600 cursor-default'
                              : loading || !canCreateCalendarEvent
                              ? 'border-gray-200 bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:text-gray-900'
                          }`}
                          style={{ WebkitAppRegion: 'no-drag' } as any}
                        >
                          {created ? 'Added' : loading ? 'Adding…' : !canCreateCalendarEvent ? 'macOS only' : 'Create event'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {transcript && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-gray-700">
                    <span>AI summary</span>
                    {summaryStatus === 'ready' && summaryText && (
                      <button
                        onClick={handleDownloadSummary}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-500 hover:text-gray-900"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                      >
                        Download summary
                      </button>
                    )}
                  </div>

                  {summaryStatus === 'loading' && (
                    <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <div className="h-2 w-2 animate-ping rounded-full bg-gray-500" />
                      Generating summary…
                    </div>
                  )}

                  {summaryStatus === 'error' && summaryError && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      <AlertCircle size={14} className="text-red-600" />
                      {summaryError}
                    </div>
                  )}

                  {summaryStatus === 'ready' && summaryListItems.length > 0 && (
                    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                        Summary highlights
                      </h4>
                      <ul className="list-disc space-y-1 pl-4">
                        {summaryListItems.map((line, index) => (
                          <li key={`${line}-${index}`} className="leading-snug">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summaryStatus === 'ready' && summaryListItems.length === 0 && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      No summary details returned. Try generating again once the transcript fills in.
                    </div>
                  )}

                  {summaryStatus === 'idle' && (
                    <button
                      onClick={handleSummarizeTranscript}
                      disabled={!transcript}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                      style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                      Summarize transcript
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="p-3 border-t border-gray-200 bg-gray-100 flex justify-between items-center text-xs">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className={isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'} />
              <span className={isRecording ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                {isRecording ? 'On' : 'Off'}
              </span>
            </div>
          </div>
          <span className={isRecording ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {isRecording ? isPaused ? '⏸️ Paused' : '🔴 Recording' : '○ Idle'}
          </span>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-100" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex gap-2">
          {!isRecording ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold transition text-xs border border-black cursor-pointer"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              <Mic size={16} />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg transition border border-gray-300 cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-xs border border-red-600 cursor-pointer"
                style={{ WebkitAppRegion: 'no-drag' } as any}
              >
                ■ Stop
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || (!transcript && !notes)}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-semibold transition text-xs border border-black disabled:border-gray-300 cursor-pointer"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

