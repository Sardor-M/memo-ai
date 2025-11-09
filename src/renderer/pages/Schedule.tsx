import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns';
import {
  Brain,
  CalendarCheck,
  CalendarDays,
  Clock,
  Loader2,
  ListChecks,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  CALENDAR_EVENTS_UPDATED_EVENT,
  CalendarEvent,
  addCalendarEventEntry,
  loadCalendarEvents,
} from '../utils/calendar';
import {
  HISTORY_UPDATED_EVENT,
  HistoryEntry,
  loadHistory,
} from '../utils/history';

type EnrichedEvent = CalendarEvent & {
  startDate: Date;
  endDate: Date;
};

type FocusBlock = {
  id: string;
  start: Date;
  end: Date;
  duration: number;
};

type ActionItem = {
  id: string;
  text: string;
  sourceTitle: string;
  createdAt: Date;
};

const MIN_BLOCK_MINUTES = 45;

function enrichEvents(events: CalendarEvent[]): EnrichedEvent[] {
  return events
    .map(event => {
      const startDate = parseISO(event.start);
      const endDate = event.end ? parseISO(event.end) : startDate;
      if (Number.isNaN(startDate.getTime())) return null;
      return {
        ...event,
        startDate,
        endDate,
      };
    })
    .filter((event): event is EnrichedEvent => Boolean(event));
}

function computeUpcomingEvents(events: EnrichedEvent[]) {
  const now = new Date();
  return events
    .filter(event => isAfter(event.endDate, now) || isSameDay(event.startDate, now))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

function computeFocusBlocks(events: EnrichedEvent[]): FocusBlock[] {
  const now = new Date();
  const start = now;
  const end = endOfDay(now);

  const todaysEvents = events
    .filter(event => isSameDay(event.startDate, now) && isAfter(event.endDate, start))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const blocks: FocusBlock[] = [];
  let cursor = start;

  for (const event of todaysEvents) {
    if (isBefore(event.startDate, cursor)) {
      cursor = event.endDate > cursor ? event.endDate : cursor;
      continue;
    }

    const gapMinutes = differenceInMinutes(event.startDate, cursor);
    if (gapMinutes >= MIN_BLOCK_MINUTES) {
      blocks.push({
        id: `${cursor.toISOString()}-${event.startDate.toISOString()}`,
        start: cursor,
        end: event.startDate,
        duration: gapMinutes,
      });
    }
    cursor = event.endDate > cursor ? event.endDate : cursor;
  }

  const tailGapMinutes = differenceInMinutes(end, cursor);
  if (tailGapMinutes >= MIN_BLOCK_MINUTES) {
    blocks.push({
      id: `${cursor.toISOString()}-${end.toISOString()}`,
      start: cursor,
      end,
      duration: tailGapMinutes,
    });
  }

  return blocks.slice(0, 3);
}

function extractActionItems(entries: HistoryEntry[]): ActionItem[] {
  const items: ActionItem[] = [];

  entries.forEach(entry => {
    const candidateText = `${entry.summary ?? ''}\n${entry.notes ?? ''}`;
    const lines = candidateText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    lines.forEach((line, index) => {
      if (/^(?:[-*•]|todo[:\s])/i.test(line) || /\baction\b/i.test(line)) {
        const cleaned = line.replace(/^(?:[-*•]\s*)/g, '').trim();
        items.push({
          id: `${entry.id}-${index}`,
          text: cleaned,
          sourceTitle: entry.title,
          createdAt: new Date(entry.createdAt),
        });
      }
    });
  });

  return items
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
}

function formatTimeRange(start: Date, end: Date) {
  return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Schedule() {
  const [events, setEvents] = useState(() => enrichEvents(loadCalendarEvents()));
  const [history, setHistory] = useState(() => loadHistory());
  const [planStatus, setPlanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [planText, setPlanText] = useState('');
  const [planError, setPlanError] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventSaving, setEventSaving] = useState<'idle' | 'saving'>('idle');
  const [eventError, setEventError] = useState<string | null>(null);
  const [aiEventStatus, setAiEventStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [aiEventError, setAiEventError] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(() => {
    const now = new Date();
    const rounded = new Date(Math.ceil(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
    const later = new Date(rounded.getTime() + 60 * 60 * 1000);
    return {
      title: '',
      meetingUrl: '',
      location: '',
      notes: '',
      start: toDateTimeLocalValue(rounded),
      end: toDateTimeLocalValue(later),
    };
  });

  useEffect(() => {
    const handleCalendarUpdate = () => setEvents(enrichEvents(loadCalendarEvents()));
    window.addEventListener(CALENDAR_EVENTS_UPDATED_EVENT, handleCalendarUpdate);
    return () => window.removeEventListener(CALENDAR_EVENTS_UPDATED_EVENT, handleCalendarUpdate);
  }, []);

  useEffect(() => {
    const handleHistoryUpdate = () => setHistory(loadHistory());
    window.addEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, handleHistoryUpdate as EventListener);
  }, []);

  const upcomingEvents = useMemo(() => computeUpcomingEvents(events), [events]);
  const focusBlocks = useMemo(() => computeFocusBlocks(events), [events]);
  const actionItems = useMemo(() => extractActionItems(history), [history]);

  const nextEvent = upcomingEvents[0];
  const upcomingWithinWeek = useMemo(
    () => upcomingEvents.filter(event => differenceInMinutes(event.startDate, new Date()) <= 10080),
    [upcomingEvents]
  );

  const handleGenerateAIPlan = async () => {
    if (planStatus === 'loading') return;
    if (!window.electronAPI?.summarizeWithOpenAI) {
      setPlanStatus('error');
      setPlanError('AI planning is not available in this build.');
      return;
    }

    setPlanStatus('loading');
    setPlanError(null);

    const eventDigest =
      upcomingWithinWeek
        .slice(0, 5)
        .map(event =>
          [
            `• ${event.title}`,
            `  When: ${format(event.startDate, 'EEE MMM d, h:mm a')} - ${format(event.endDate, 'h:mm a')}`,
            event.location ? `  Where: ${event.location}` : null,
          ]
            .filter(Boolean)
            .join('\n')
        )
        .join('\n') || '• No meetings scheduled for the next 7 days.';

    const actionDigest =
      actionItems
        .map(item => `• ${item.text} (from ${item.sourceTitle})`)
        .join('\n') || '• No explicit follow-ups found in recent notes.';

    const planningPrompt = [
      'You are Memo-AI, a focused work assistant. Craft a concise schedule plan for the user.',
      'Use the details below to recommend how to spend the day, highlight urgent follow-ups, and suggest preparation for upcoming meetings.',
      '',
      'Upcoming meetings:',
      eventDigest,
      '',
      'Action items to address:',
      actionDigest,
      '',
      'Produce a short plan with:',
      '- Key priorities in order.',
      '- Focus blocks referencing available time windows.',
      '- Suggested preparation for the next meeting.',
      '- Optional quick wins the user can tackle if time remains.',
    ].join('\n');

    try {
      const response = await window.electronAPI.summarizeWithOpenAI({
        transcript: planningPrompt,
        summaryType: 'paragraph',
      });

      if (!response?.success || !response.summary) {
        setPlanStatus('error');
        setPlanError(response?.error ?? 'The AI planner could not generate a response.');
        return;
      }

      setPlanText(response.summary.trim());
      setPlanStatus('success');
    } catch (error) {
      console.error('Failed to generate AI schedule plan:', error);
      setPlanStatus('error');
      setPlanError(error instanceof Error ? error.message : 'Unexpected error while generating the plan.');
    }
  };

  const resetEventForm = () => {
    const now = new Date();
    const rounded = new Date(Math.ceil(now.getTime() / (15 * 60 * 1000)) * (15 * 60 * 1000));
    const later = new Date(rounded.getTime() + 60 * 60 * 1000);
    setEventForm({
      title: '',
      meetingUrl: '',
      location: '',
      notes: '',
      start: toDateTimeLocalValue(rounded),
      end: toDateTimeLocalValue(later),
    });
    setEventError(null);
    setAiEventStatus('idle');
    setAiEventError(null);
  };

  const handleOpenEventModal = () => {
    resetEventForm();
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
  };

  const handleEventFieldChange = (field: keyof typeof eventForm, value: string) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateAiEvent = async () => {
    if (!window.electronAPI?.summarizeWithOpenAI) {
      setAiEventStatus('error');
      setAiEventError('AI event generation is not available in this build.');
      return;
    }
    setAiEventStatus('loading');
    setAiEventError(null);

    const context = [
      'Suggest a meeting the user might need to plan today.',
      'Return a JSON object with fields: title, start, end, location, meetingUrl, notes.',
      'start and end must be ISO 8601 timestamps in the user’s current timezone.',
      'If you are unsure of a value, leave it empty.',
      '',
      'Recent action items:',
      actionItems.slice(0, 3).map(item => `- ${item.text}`).join('\n') || '- None noted.',
    ].join('\n');

    try {
      const response = await window.electronAPI.summarizeWithOpenAI({
        transcript: context,
        summaryType: 'paragraph',
      });

      if (!response?.success || !response.summary) {
        throw new Error(response?.error ?? 'Unable to generate a meeting suggestion.');
      }

      const firstJson = response.summary.match(/\{[\s\S]*\}/);
      if (!firstJson) {
        throw new Error('AI response did not include structured data.');
      }

      const parsed = JSON.parse(firstJson[0]);

      const parsedStart = parsed.start ? new Date(parsed.start) : null;
      const parsedEnd = parsed.end ? new Date(parsed.end) : null;

      if (!parsedStart || Number.isNaN(parsedStart.getTime())) {
        throw new Error('AI did not provide a valid start time.');
      }

      const endDate = parsedEnd && !Number.isNaN(parsedEnd.getTime())
        ? parsedEnd
        : new Date(parsedStart.getTime() + 60 * 60 * 1000);

      setEventForm(prev => ({
        ...prev,
        title: parsed.title ?? prev.title,
        meetingUrl: parsed.meetingUrl ?? parsed.url ?? prev.meetingUrl,
        location: parsed.location ?? prev.location,
        notes: parsed.notes ?? prev.notes,
        start: toDateTimeLocalValue(parsedStart),
        end: toDateTimeLocalValue(endDate),
      }));
      setAiEventStatus('idle');
    } catch (error) {
      console.error('Failed to generate AI event:', error);
      setAiEventStatus('error');
      setAiEventError(error instanceof Error ? error.message : 'Unexpected AI error.');
    }
  };

  const handleSaveEvent = async () => {
    setEventError(null);
    const { title, start, end, meetingUrl, location, notes } = eventForm;

    if (!title.trim()) {
      setEventError('Title is required.');
      return;
    }

    if (!start) {
      setEventError('Start time is required.');
      return;
    }

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      setEventError('Start time is invalid.');
      return;
    }

    const endDate = end
      ? new Date(end)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setEventError('End time must be after the start time.');
      return;
    }

    setEventSaving('saving');

    try {
      const eventId = `manual-${Date.now()}`;
      const summaryParts = [
        notes.trim(),
        meetingUrl ? `Meeting URL: ${meetingUrl.trim()}` : '',
      ].filter(Boolean);

      addCalendarEventEntry({
        id: eventId,
        title: title.trim(),
        calendar: 'Manual',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location: location.trim(),
        summary: summaryParts.join('\n'),
        notes: summaryParts.join('\n'),
      });

      if (window.electronAPI?.createCalendarEvent) {
        const result = await window.electronAPI.createCalendarEvent({
          title: title.trim(),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          location: meetingUrl.trim() || location.trim(),
        });
        if (!result?.success) {
          console.warn('Failed to add event to macOS Calendar:', result?.error);
        }
      }

      setEvents(enrichEvents(loadCalendarEvents()));
      setShowEventModal(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      setEventError(error instanceof Error ? error.message : 'Unable to save event.');
    } finally {
      setEventSaving('idle');
    }
  };

  const handleEventSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSaveEvent();
  };

  return (
    <>
    <div className="flex-1 overflow-auto bg-gray-100 px-5 py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
              <Sparkles size={14} className="text-indigo-500" />
              Smart schedule
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Daily schedule</h1>
            <p className="text-sm text-slate-600">
              Review your meetings, carve out focus time, and let Memo-AI surface the next best actions.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-slate-300"
            onClick={handleGenerateAIPlan}
            disabled={planStatus === 'loading'}
          >
            <Brain size={16} className="mr-2" />
            {planStatus === 'loading' ? 'Generating plan…' : 'Generate AI day plan'}
          </Button>
        </header>

        {planStatus === 'error' && planError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {planError}
          </div>
        )}
        {planStatus === 'success' && planText && (
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                AI day plan
              </CardTitle>
              <CardDescription>Your tailored schedule based on upcoming meetings and recent notes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-slate-700 whitespace-pre-wrap">{planText}</div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck size={16} className="text-emerald-500" />
                  Next meeting
                </CardTitle>
                <CardDescription>
                  {nextEvent ? 'Prep and context for what’s coming up next.' : 'You are all caught up.'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 border-slate-200 text-xs"
                onClick={handleOpenEventModal}
              >
                <Plus size={14} />
                Add meeting
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {nextEvent ? (
                <>
                  <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-slate-900 font-medium">{nextEvent.title}</span>
                    <span className="text-xs text-slate-500">{format(nextEvent.startDate, 'EEEE, MMMM d')}</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimeRange(nextEvent.startDate, nextEvent.endDate)}
                      </span>
                      {nextEvent.location && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {nextEvent.location}
                        </span>
                      )}
                    </div>
                    {nextEvent.summary && (
                      <p className="text-xs text-slate-500">
                        {nextEvent.summary.length > 180
                          ? `${nextEvent.summary.slice(0, 180)}…`
                          : nextEvent.summary}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                    Tip: Drop relevant transcripts or notes into Memo-AI before the meeting and click “Generate AI day plan” to receive a prep checklist.
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                    No upcoming meetings detected. Sync Calendar from Settings to populate this section.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks size={16} className="text-amber-500" />
                Suggested follow-ups
              </CardTitle>
              <CardDescription>
                AI surfaces possible action items from your recent recordings and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              {actionItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                  Add notes or mark action items in the recording widget to see follow-up suggestions here.
                </div>
              ) : (
                actionItems.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-slate-900 font-medium">{item.text}</span>
                    <span className="text-xs text-slate-500">
                      From “{item.sourceTitle}” · {format(item.createdAt, 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} className="text-sky-500" />
              Focus time opportunities
            </CardTitle>
            <CardDescription>Memo-AI spots open blocks today long enough for deep work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {focusBlocks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                Your day is tightly booked. Consider declining non-essential meetings to reclaim focus time.
              </div>
            ) : (
              focusBlocks.map(block => (
                <div
                  key={block.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <span className="text-slate-900 font-medium">
                      {formatTimeRange(block.start, block.end)}
                    </span>
                    <p className="text-xs text-slate-500">
                      {block.duration >= 90
                        ? 'Ideal for heads-down project work.'
                        : 'Great for knock-out tasks or async catch up.'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(block.duration / 15) * 15} min available
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays size={16} className="text-slate-500" />
              Week at a glance
            </CardTitle>
            <CardDescription>Upcoming meetings and commitments for the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {upcomingWithinWeek.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-slate-500">
                Nothing on the books for the next week. Use the recording widget to capture new commitments.
              </div>
            ) : (
              upcomingWithinWeek.map(event => (
                <div
                  key={event.id}
                  className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <span className="text-slate-900 font-medium">{event.title}</span>
                    <p className="text-xs text-slate-500">
                      {format(event.startDate, 'EEE, MMM d')} · {formatTimeRange(event.startDate, event.endDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                      {event.calendar ?? 'Calendar'}
                    </span>
                    {event.location && (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Add calendar meeting</h2>
                <p className="text-[11px] text-slate-500">Keep upcoming meetings synced in Memo-AI and macOS Calendar.</p>
              </div>
              <button
                onClick={handleCloseEventModal}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Title</label>
                <Input
                  value={eventForm.title}
                  onChange={event => handleEventFieldChange('title', event.target.value)}
                  placeholder="e.g. Customer sync with Acme"
                  className="text-sm"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Start</label>
                  <Input
                    type="datetime-local"
                    value={eventForm.start}
                    onChange={event => handleEventFieldChange('start', event.target.value)}
                    className="text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">End</label>
                  <Input
                    type="datetime-local"
                    value={eventForm.end}
                    onChange={event => handleEventFieldChange('end', event.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Location</label>
                  <Input
                    value={eventForm.location}
                    onChange={event => handleEventFieldChange('location', event.target.value)}
                    placeholder="Office HQ"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Meeting link</label>
                  <Input
                    value={eventForm.meetingUrl}
                    onChange={event => handleEventFieldChange('meetingUrl', event.target.value)}
                    placeholder="https://"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Notes</label>
                <Textarea
                  value={eventForm.notes}
                  onChange={event => handleEventFieldChange('notes', event.target.value)}
                  placeholder="Add agenda, attendees, or prep tasks."
                  rows={4}
                  className="text-sm"
                />
              </div>
              {aiEventError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                  {aiEventError}
                </div>
              )}
              {eventError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                  {eventError}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2 border-slate-200 text-xs"
                  onClick={handleGenerateAiEvent}
                  disabled={aiEventStatus === 'loading' || eventSaving === 'saving'}
                >
                  {aiEventStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate with AI
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleCloseEventModal}
                    disabled={eventSaving === 'saving'}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-slate-900 px-4 text-xs text-white hover:bg-slate-800"
                    disabled={eventSaving === 'saving'}
                  >
                    {eventSaving === 'saving' ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      'Save meeting'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}