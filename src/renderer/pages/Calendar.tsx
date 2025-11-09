import { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CalendarEvent, CALENDAR_EVENTS_UPDATED_EVENT, loadCalendarEvents, saveCalendarEvents } from '../utils/calendar';

const isBrowser = typeof window !== 'undefined';

function extractMeetingUrl(event: CalendarEvent): string | null {
  const fields = [
    event.location,
    event.notes,
    event.summary,
    (event as any).url as string | undefined,
  ];

  for (const field of fields) {
    if (!field || typeof field !== 'string') continue;
    const match = field.match(/https?:\/\/[^\s>]+/i);
    if (match) {
      return match[0].replace(/[),.;]+$/, '');
    }
  }

  return null;
}

function readCalendarImportEnabled(): boolean {
  if (!isBrowser) return false;
  try {
    const raw = window.localStorage.getItem('memoai-settings');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.importCalendarEvents);
  } catch (error) {
    console.warn('Failed to read calendar settings:', error);
    return false;
  }
}

function useCalendarDays(month: Date) {
  return useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);
}

export default function Calendar() {
  const [month, setMonth] = useState(() => new Date());
  const [importedEvents, setImportedEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [calendarImportEnabled, setCalendarImportEnabled] = useState(() => readCalendarImportEnabled());
  const [autoSyncState, setAutoSyncState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [autoSyncError, setAutoSyncError] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setImportedEvents(loadCalendarEvents());
    window.addEventListener(CALENDAR_EVENTS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CALENDAR_EVENTS_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!isBrowser) return;
    const updateFlag = () => setCalendarImportEnabled(readCalendarImportEnabled());
    updateFlag();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'memoai-settings') {
        updateFlag();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', updateFlag);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', updateFlag);
    };
  }, []);

  useEffect(() => {
    if (!calendarImportEnabled) return;
    if (!isBrowser) return;
    if (importedEvents.length > 0) return;
    const fetchCalendarEvents = window.electronAPI?.fetchCalendarEvents;
    if (!fetchCalendarEvents) return;

    let cancelled = false;
    const syncEvents = async () => {
      setAutoSyncState('loading');
      setAutoSyncError(null);

      try {
        const result = await fetchCalendarEvents();
        if (cancelled) return;

        if (!result?.success || !Array.isArray(result.events)) {
          setAutoSyncState('error');
          setAutoSyncError(result?.error ?? 'Unable to import calendar events from Calendar.');
          return;
        }

        const normalizedEvents: CalendarEvent[] = result.events
          .filter(event => event && event.start)
          .map(event => ({
            id: event.id,
            calendar: event.calendar ?? 'Calendar',
            title: event.title ?? 'Untitled event',
            start: event.start,
            end: event.end ?? event.start,
            location: event.location ?? '',
            summary: event.notes || event.summary || '',
            notes: event.notes ?? '',
          }));

        saveCalendarEvents(normalizedEvents);
        setAutoSyncState('success');
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to auto-sync calendar events:', error);
        setAutoSyncState('error');
        setAutoSyncError(error instanceof Error ? error.message : 'Unable to import calendar events from Calendar.');
      }
    };

    syncEvents();

    return () => {
      cancelled = true;
    };
  }, [calendarImportEnabled, importedEvents.length]);

  const days = useCalendarDays(month);
  const usingImported = importedEvents.length > 0;
  const events = useMemo(() =>
    importedEvents.map(event => ({
      ...event,
      dateObj: parseISO(event.start),
      meetingUrl: extractMeetingUrl(event),
    })),
  [importedEvents]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, (typeof events)[number][]>();
    for (const event of events) {
      const key = format(event.dateObj, 'yyyy-MM-dd');
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const visibleEvents = useMemo(() => events.filter(event => isSameMonth(event.dateObj, month)), [events, month]);

  const handleJoinMeeting = (event: (typeof events)[number]) => {
    if (!event.meetingUrl) {
      return;
    }

    if (window.electronAPI?.startRecording) {
      window.electronAPI.startRecording().catch(error => {
        console.error('Failed to start meeting recording:', error);
      });
    }

    window.open(event.meetingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-100 px-5 py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
            <p className="text-sm text-slate-600">
              Track interviews, reviews, and follow-ups for your recordings in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-none" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft size={12} />
            </Button>
            <Button variant="outline" size="sm" className="border-slate-300" onClick={() => setMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" className="border-none" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight size={12} />
            </Button>
          </div>
        </header>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{format(month, 'MMMM yyyy')}</CardTitle>
            <CardDescription>Hover each day to reveal upcoming items.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-px rounded-lg bg-slate-200 p-px text-xs text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => (
              <div key={label} className="rounded-md bg-slate-100 py-2 text-center font-medium text-slate-600">
                {label}
              </div>
            ))}
            {days.map((day, idx) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(key) ?? [];
              const isCurrentMonth = isSameMonth(day, month);
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={`${key}-${idx}`}
                  className={`relative min-h-[90px] rounded-md border border-transparent bg-white p-2 transition hover:border-slate-300 hover:shadow-sm ${
                    !isCurrentMonth ? 'bg-slate-50 text-slate-300' : ''
                  }`}
                >
                  <div className={`flex items-center justify-between text-[11px] font-medium ${today ? 'text-slate-900' : ''}`}>
                    <span>{format(day, 'd')}</span>
                    {today && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">Today</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`${event.accent} group rounded-md px-2 py-1 text-[10px] font-medium text-white shadow-sm transition hover:shadow-md`}
                      >
                        <p className="truncate">{event.title}</p>
                        <p className="opacity-80">{format(event.dateObj, 'HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming meetings</CardTitle>
            <CardDescription>
              {usingImported
                ? 'Events pulled directly from your Calendar app.'
                : calendarImportEnabled
                ? "No synced events yet. We'll pull your upcoming meetings once Calendar access is granted."
                : 'Enable Calendar sync in Settings to show your own meetings.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {autoSyncState === 'loading' && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                Syncing events from Calendar...
              </div>
            )}
            {autoSyncState === 'error' && autoSyncError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {autoSyncError}
              </div>
            )}
            {visibleEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                {usingImported
                  ? 'Nothing scheduled for this month yet.'
                  : calendarImportEnabled
                  ? 'No upcoming Calendar events found for this month.'
                  : 'Enable Calendar sync in Settings to show your own meetings.'}
              </div>
            ) : (
              visibleEvents.map(event => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-medium">{event.title}</span>
                    {event.summary && <span className="text-xs text-slate-500">{event.summary}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> {format(event.dateObj, 'MMM d')}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {format(event.dateObj, 'HH:mm')}</span>
                    {event.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                    )}
                    {event.meetingUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 border-slate-300 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => handleJoinMeeting(event)}
                      >
                        <ExternalLink size={12} />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
