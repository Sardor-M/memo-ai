import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Archive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { HISTORY_UPDATED_EVENT, HistoryEntry, loadHistory } from '../utils/history';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeFileName(title: string, suffix: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  const safeSlug = slug.replace(/^-+|-+$/g, '') || 'memo-ai-recording';
  return `${safeSlug}-${suffix}.txt`;
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  useEffect(() => {
    const handler = () => setEntries(loadHistory());
    window.addEventListener(HISTORY_UPDATED_EVENT, handler);
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, handler);
  }, []);

  const groupedEntries = useMemo(() => entries, [entries]);

  const handleDownload = (entry: HistoryEntry, type: 'summary' | 'transcript') => {
    if (type === 'summary') {
      const summaryContent = `Summary for ${entry.title}\nRecorded: ${formatDate(entry.createdAt)}\nDuration: ${entry.duration}\n\n${entry.summary}`;
      triggerDownload(summaryContent, makeFileName(entry.title, 'summary'));
      return;
    }

    const transcriptContent = `Transcript for ${entry.title}\nRecorded: ${formatDate(entry.createdAt)}\nDuration: ${entry.duration}\n\n--- Transcript ---\n${entry.transcript || 'No transcript captured.'}\n\n--- Notes ---\n${entry.notes || 'No notes captured.'}`;
    triggerDownload(transcriptContent, makeFileName(entry.title, 'transcript'));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-100 px-5 py-5">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Recording history</h1>
          <p className="max-w-xl text-xs text-slate-500">
            Every session you complete in Memo-AI is captured here with transcripts, notes, and quick exports.
          </p>
        </div>

        {groupedEntries.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center text-slate-500">
              <Archive size={32} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-600">No recordings yet</p>
              <p className="text-xs text-slate-500">
                Finish a recording in the widget and tap save to see it appear here instantly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {groupedEntries.map(entry => (
              <Card key={entry.id} className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-slate-900 leading-tight">{entry.title}</CardTitle>
                      <CardDescription className="text-[11px] text-slate-500">
                        {formatDate(entry.createdAt)} · {entry.duration}
                      </CardDescription>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                      Transcript saved
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 px-6 py-3 text-sm text-slate-600">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {entry.summary}
                  </p>
                  {entry.notes && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">Notes:</span>{' '}
                      {entry.notes.length > 160 ? `${entry.notes.slice(0, 160)}…` : entry.notes}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate">
                    Saved to {entry.filePath ? entry.filePath : 'Memo-AI documents folder'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto rounded-md border-slate-300 px-2 py-1 text-[11px]"
                      onClick={() => handleDownload(entry, 'summary')}
                    >
                      <Download size={12} className="mr-1.5" /> Summary
                    </Button>
                    <Button
                      size="sm"
                      className="h-auto rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white hover:bg-slate-800"
                      onClick={() => handleDownload(entry, 'transcript')}
                    >
                      <FileText size={12} className="mr-1.5" /> Transcript
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

