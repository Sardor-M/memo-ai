export type CalendarEvent = {
  id: string;
  calendar?: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  summary?: string;
  notes?: string;
  accent?: string;
};

const STORAGE_KEY = 'memo-ai-calendar-events';
export const CALENDAR_EVENTS_UPDATED_EVENT = 'memo-ai-calendar-events-updated';

const palette = [
  'bg-emerald-500/90',
  'bg-sky-500/90',
  'bg-orange-500/90',
  'bg-purple-500/90',
  'bg-rose-500/90',
  'bg-amber-500/90',
  'bg-indigo-500/90',
];

const isBrowser = typeof window !== 'undefined';

export function loadCalendarEvents(): CalendarEvent[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const sanitized = parsed
      .filter((event: CalendarEvent) => event && event.id && event.start)
      .map((event: CalendarEvent) => ({
        ...event,
        title: event.title || 'Untitled event',
        calendar: event.calendar || 'Calendar',
        end: event.end || event.start,
      }))
      .sort(
        (a: CalendarEvent, b: CalendarEvent) =>
          new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    return assignAccents(sanitized);
  } catch (error) {
    console.warn('Failed to load calendar events:', error);
    return [];
  }
}

export function saveCalendarEvents(events: CalendarEvent[]) {
  if (!isBrowser) return;
  try {
    const sanitized = events
      .filter(event => event && event.id && event.start)
      .map(event => ({
        ...event,
        title: event.title || 'Untitled event',
        calendar: event.calendar || 'Calendar',
        end: event.end || event.start,
      }))
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    const withAccents = assignAccents(sanitized);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withAccents));
    window.dispatchEvent(new CustomEvent(CALENDAR_EVENTS_UPDATED_EVENT));
  } catch (error) {
    console.warn('Failed to save calendar events:', error);
  }
}

export function addCalendarEventEntry(event: CalendarEvent) {
  if (!isBrowser) return;
  const current = loadCalendarEvents();
  const unique = [event, ...current.filter(existing => existing.id !== event.id)];
  const withAccents = assignAccents(unique);
  saveCalendarEvents(withAccents);
}

export function assignAccents(events: CalendarEvent[]): CalendarEvent[] {
  const colorByCalendar = new Map<string, string>();
  let paletteIndex = 0;

  return events.map(event => {
    const calendarName = event.calendar ?? 'Calendar';
    if (!colorByCalendar.has(calendarName)) {
      const color = palette[paletteIndex % palette.length];
      paletteIndex += 1;
      colorByCalendar.set(calendarName, color);
    }
    return {
      ...event,
      accent: colorByCalendar.get(calendarName),
    };
  });
}
