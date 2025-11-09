import { useEffect, useMemo, useRef, useState } from 'react';
import { History as HistoryIcon, Mic, PenSquare, Send, Sparkles, Square } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

const ideas = [
  {
    title: 'Summarise yesterday’s call',
    body: 'Highlight action items, owners, and blockers in plain language.',
  },
  {
    title: 'Draft a follow-up note',
    body: 'Turn raw transcript snippets into a polished message with next steps.',
  },
];

const quickPrompts = [
  'Give me a 3 bullet recap of this transcript.',
  'List risks and blockers mentioned in the last recording.',
  'Turn the latest meeting into a stand-up update.',
  'Summarise the latest recording and provide a list of action items.',
];

const buildAssistantPrompt = (history: ChatMessage[], latestUserInput: string) => {
  const conversation = [
    ...history,
    {
      id: `prompt-${Date.now()}`,
      role: 'user' as ChatRole,
      content: latestUserInput,
      timestamp: new Date(),
    },
  ];

  const serialized = conversation
    .map(message => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n');

  return [
    'You are Memo-AI. Reply in first person, stay friendly, and offer quick next steps.',
    '',
    'Conversation so far:',
    serialized,
    '',
    'Assistant:',
  ].join('\n');
};

export default function Dashboard() {
  const { isRecording, isMicrophoneActive, isCameraActive, startRecording, stopRecording } = useDeviceDetection();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const sendTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        window.clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
      if (sendTimeoutRef.current) {
        window.clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    };
  }, []);

  const startStreamingReply = (messageId: string, fullText: string) => {
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    const tokens = fullText.split(/\s+/).filter(Boolean);
    let index = 0;

    if (tokens.length === 0) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, content: '', isStreaming: false } : msg
        )
      );
      setIsStreaming(false);
      return;
    }

    streamIntervalRef.current = window.setInterval(() => {
      index += 1;
      const next = tokens.slice(0, index).join(' ');
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? { ...msg, content: next } : msg))
      );

      if (index >= tokens.length) {
        if (streamIntervalRef.current) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, content: fullText, isStreaming: false } : msg
          )
        );
        setIsStreaming(false);
      }
    }, 32);
  };

  const executeSend = async () => {
    if (!draft.trim() || isStreaming) return;
    const text = draft.trim();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setDraft('');
    setIsStreaming(true);
    setChatError(null);

    const prompt = buildAssistantPrompt(messages, text);

    if (!window.electronAPI?.summarizeWithOpenAI) {
      const fallback = 'Memo-AI chat is unavailable in this build.';
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: fallback, isStreaming: false }
            : msg
        )
      );
      setIsStreaming(false);
      setChatError(fallback);
      return;
    }

    let streamingStarted = false;

    try {
      const response = await window.electronAPI.summarizeWithOpenAI({
        transcript: prompt,
        summaryType: 'paragraph',
      });

      if (!response?.success || !response.summary) {
        const errorMessage = response?.error ?? 'Memo-AI could not generate a reply.';
        throw new Error(errorMessage);
      }

      const reply = response.summary.trim();
      streamingStarted = true;
      startStreamingReply(assistantMessage.id, reply);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Memo-AI encountered an unexpected error.';
      setChatError(message);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: `Memo-AI ran into an issue: ${message}`, isStreaming: false }
            : msg
        )
      );
      setIsStreaming(false);
    } finally {
      if (!streamingStarted) {
        setIsStreaming(false);
      }
    }
  };

  const handleSend = () => {
    if (sendTimeoutRef.current) {
      window.clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }

    sendTimeoutRef.current = window.setTimeout(() => {
      sendTimeoutRef.current = null;
      void executeSend();
    }, 250);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const heroStatus = useMemo(() => {
    return {
      microphone: isMicrophoneActive ? 'Mic ready' : 'Mic idle',
      camera: isCameraActive ? 'Camera active' : 'Camera idle',
      recording: isRecording ? 'Recording…' : 'Start recording',
    };
  }, [isMicrophoneActive, isCameraActive, isRecording]);

  const recordingButtonClass = `inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 ${
    isRecording
      ? 'border-red-500 bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500'
      : 'border-slate-900 bg-white text-slate-900 shadow-sm hover:bg-slate-900 hover:text-white focus-visible:ring-slate-900'
  }`;

  return (
    <div className="flex-1 flex flex-col bg-gray-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-5 py-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                  <Sparkles size={12} className="text-orange-500" /> Memo-AI workspace
                </div>
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Good evening, builder</h1>
                  <p className="max-w-xl text-sm text-slate-600 leading-relaxed">
                    Paste transcripts, ask questions, or start a new capture. Memo-AI keeps everything tidy so you can move faster.
                  </p>
                  <p className="text-xs text-slate-500">
                    Your private workspace for capturing, summarising, and managing your work.
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 mt-7 bg-white/90 p-3 lg:w-[260px] lg:self-start">
                <Button
                  onClick={handleRecordingToggle}
                  variant="default"
                  size="lg"
                  className={recordingButtonClass}
                >
                  {isRecording ? (
                    <>
                      <Square size={16} /> Stop recording
                    </>
                ) : (
                  <>
                    <Mic size={16} /> Start recording
                  </>
                )}
              </Button>
              <div className="grid gap-1.5 text-xs text-slate-600">
                  <span className={`inline-flex items-center justify-between rounded-md border px-3 py-1 mt-2.5 ${
                    isMicrophoneActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'
                  }`}>
                    <span className="inline-flex items-center gap-2">
                      <Mic size={12} /> Mic
                    </span>
                    {heroStatus.microphone}
                  </span>
                  <span className={`inline-flex items-center justify-between rounded-md border px-3 py-1 ${
                    isCameraActive ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white'
                  }`}>
                    <span className="inline-flex items-center gap-2">
                      <PenSquare size={12} /> Camera
                    </span>
                    {heroStatus.camera}
                  </span>
                  <a
                    href="#/history"
                    className="inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2">
                      <HistoryIcon size={12} /> History
                    </span>
                    Open
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-5 py-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ideas.map(idea => (
              <Card key={idea.title} className="h-full border-slate-200 bg-white">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-sm font-semibold text-slate-900">{idea.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-500 max-w-xs">{idea.body}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-slate-200 px-2 py-1 text-xs"
                    onClick={() => setDraft(idea.body)}
                  >
                    <Sparkles size={12} className="mr-1.5" />
                    Try prompt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map(prompt => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white hover:bg-slate-100"
                onClick={() => setDraft(prompt)}
                >
                  <Sparkles size={12} className='mr-1.5' /> {prompt}
              </Button>
            ))}
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Memo chat</CardTitle>
              <CardDescription className="text-slate-600">
                Ask questions, drop meeting notes, or request drafts. I’ll keep track of the conversation for you.
              </CardDescription>
            </CardHeader>
            {chatError && (
              <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
                {chatError}
              </div>
            )}
            {messages.length === 0 ? (
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
                <p className="text-2xl font-semibold tracking-tight text-slate-900">Ready when you are.</p>
                <p className="max-w-md text-sm text-slate-500">
                  Tell Memo-AI what you need – a summary, follow-up, task list, or something custom. Paste transcript text or describe the context.
                </p>
                <div className="relative w-full max-w-3xl">
                  <Input
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    disabled={isStreaming}
                    className="h-16 rounded-xl border-slate-300 pr-14 text-base"
                  />
                  <Button
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    onClick={handleSend}
                    disabled={!draft.trim() || isStreaming}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                <CardContent className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`max-w-3xl rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'assistant'
                          ? 'self-start border border-slate-200 bg-slate-50 text-slate-700'
                          : 'self-end bg-slate-900 text-white'
                      }`}
                    >
                      {message.isStreaming ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="relative flex h-6 w-6 items-center justify-center">
                            <span className="absolute h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                            <span className="relative text-xs font-semibold text-slate-500">AI</span>
                          </span>
                          <span className="relative inline-flex min-h-[1.25rem] items-center">
                            <span className="animate-pulse text-slate-500">Thinking…</span>
                          </span>
                        </span>
                      ) : (
                        message.content
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-slate-200">
                  <div className="relative w-full">
                    <Textarea
                      value={draft}
                      onChange={event => setDraft(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your instructions"
                      disabled={isStreaming}
                      rows={4}
                      className="rounded-xl border-slate-300 pr-14 text-sm"
                    />
                    <Button
                      size="icon"
                      className="absolute right-3 bottom-3 h-10 w-10 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      onClick={handleSend}
                      disabled={!draft.trim() || isStreaming}
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Shift + Enter for newline · Drafts stay local until you share</p>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
