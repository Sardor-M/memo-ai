export type HistoryEntry = {
  id: string;
  title: string;
  createdAt: string;
  duration: string;
  summary: string;
  transcript: string;
  notes: string;
  filePath?: string | null;
};

const HISTORY_STORAGE_KEY = 'memo-ai-history';
export const HISTORY_UPDATED_EVENT = 'memo-ai-history-updated';

const isBrowser = typeof window !== 'undefined';

export function loadHistory(): HistoryEntry[] {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is HistoryEntry => Boolean(item && item.id && item.createdAt));
  } catch (error) {
    console.warn('Failed to load history', error);
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]) {
  if (!isBrowser) {
    return;
  }
  try {
    const limited = entries.slice(0, 100);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.warn('Failed to save history', error);
  }
}

export function addHistoryEntry(entry: HistoryEntry) {
  if (!isBrowser) {
    return;
  }

  const current = loadHistory();
  const filtered = current.filter(existing => existing.id !== entry.id);
  filtered.unshift(entry);
  saveHistory(filtered);
  window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT));
}
