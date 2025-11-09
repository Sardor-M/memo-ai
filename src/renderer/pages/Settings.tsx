import { useState, useEffect } from 'react';
import { Save, Bell, Mic, Lock, CheckCircle2, AlertCircle, Camera, Calendar as CalendarIcon } from 'lucide-react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { saveCalendarEvents } from '../utils/calendar';

type SettingsState = {
  autoTranscribe: boolean;
  notifications: boolean;
  saveLocation: string;
  audioQuality: string;
  theme: string;
  autoStartRecording: boolean;
  importCalendarEvents: boolean;
}

export default function Settings() {
  const { microphonePermission, cameraPermission, autoStartEnabled, setAutoStartEnabled, requestMicrophonePermission, requestCameraPermission } = useDeviceDetection();
  const [settings, setSettings] = useState<SettingsState>({
    autoTranscribe: true,
    notifications: true,
    saveLocation: '/Documents/MemoAI',
    audioQuality: 'high',
    theme: 'dark',
    autoStartRecording: autoStartEnabled,
    importCalendarEvents: false,
  });

  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load saved settings once
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('memoai-settings');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSettings(prev => ({
        ...prev,
        ...parsed,
        autoStartRecording: parsed.autoStartRecording ?? prev.autoStartRecording,
        importCalendarEvents: parsed.importCalendarEvents ?? prev.importCalendarEvents,
      }));
      if (typeof parsed.autoStartRecording === 'boolean') {
        setAutoStartEnabled(parsed.autoStartRecording);
      }
    } catch (error) {
      console.warn('Failed to load saved settings:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync auto-start setting
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      autoStartRecording: autoStartEnabled,
    }));
  }, [autoStartEnabled]);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => {
      const nextValue = !prev[key];
      if (key === 'autoStartRecording') {
        setAutoStartEnabled(nextValue);
      }
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const handleChange = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Settings are auto-saved in browser localStorage
      localStorage.setItem('memoai-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleBrowseForSaveLocation = async () => {
    try { 
      const result = await window.electronAPI?.selectDirectory?.();
      if (result && !result.canceled && result.path) {
        setSettings(prev => ({ ...prev, saveLocation: result.path || '' }));
      }
    } catch (error) {
      console.error('Failed to choose folder:', error);
    }
  };

  const handleSyncCalendarEvents = async () => {
    if (!settings.importCalendarEvents) {
      alert('Enable calendar import before syncing events.');
      return;
    }

    if (!window.electronAPI?.fetchCalendarEvents) {
      alert('Calendar import is not available in this build.');
      return;
    }

    setSyncStatus('loading');

    try {
      const result = await window.electronAPI.fetchCalendarEvents();
      if (!result.success || !result.events) {
        setSyncStatus('error');
        alert(result.error ?? 'Unable to import calendar events from macOS.');
        window.setTimeout(() => setSyncStatus('idle'), 2200);
        return;
      }

      const normalizedEvents = result.events.map(event => ({
        id: event.id,
        calendar: event.calendar,
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        summary: event.notes || event.summary || '',
        notes: event.notes || '',
      }));

      saveCalendarEvents(normalizedEvents);
      alert(`Imported ${normalizedEvents.length} events from Calendar.`);
      setSyncStatus('success');
      window.setTimeout(() => setSyncStatus('idle'), 2200);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      setSyncStatus('error');
      alert('Memo-AI could not access macOS Calendar. Please check permissions and try again.');
      window.setTimeout(() => setSyncStatus('idle'), 2200);
    }
  };

  const SettingToggle = ({
    icon: Icon,
    label,
    description,
    value,
    onChange,
  }: {
    icon: any;
    label: string;
    description: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5">
      <div className="flex items-start gap-3 text-sm">
        <Icon size={16} className="mt-0.5 text-slate-600" />
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full border border-transparent transition-colors ${
          value ? 'bg-slate-900 text-white' : 'bg-slate-200'
        }`}
        type="button"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-100 px-5 py-5">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-600">Tune Memo-AI to match the way you work.</p>
          </div>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-slate-800"
          >
            <Save size={18} />
            {saved ? 'Saved!' : 'Save settings'}
          </Button>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="flex items-start pb-3">
            <CardTitle className="text-base">Permissions</CardTitle>
            <CardDescription>Control access to your microphone and camera.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5">
              <div className="flex items-start gap-3 text-sm">
                <Mic size={16} className="mt-0.5 text-slate-600" />
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Microphone Access</p>
                  <p className="text-xs text-slate-500">
                    {microphonePermission === 'granted'
                      ? 'Permission granted - microphone recording enabled'
                      : microphonePermission === 'denied'
                      ? 'Permission denied - enable in system settings'
                      : 'Click to request permission'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {microphonePermission === 'granted' && <CheckCircle2 size={20} className="text-emerald-500" />}
                {microphonePermission === 'denied' ? (
                  <Button
                    size="sm"
                    onClick={() => window.electronAPI.openMicrophoneSettings?.()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Open Settings
                  </Button>
                ) : microphonePermission !== 'granted' ? (
                  <Button size="sm" onClick={requestMicrophonePermission}>
                    Request Access
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5">
              <div className="flex items-start gap-3 text-sm">
                <Camera size={16} className="mt-0.5 text-slate-600" />
                <div className="space-y-1">
                  <p className="font-medium text-slate-900">Camera Access</p>
                  <p className="text-xs text-slate-500">
                    {cameraPermission === 'granted'
                      ? 'Permission granted - video recording enabled'
                      : cameraPermission === 'denied'
                      ? 'Permission denied - enable in system settings'
                      : 'Click to request permission'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cameraPermission === 'granted' && <CheckCircle2 size={20} className="text-emerald-500" />}
                {cameraPermission === 'denied' ? (
                  <Button
                    size="sm"
                    onClick={() => window.electronAPI.openCameraSettings?.()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Open Settings
                  </Button>
                ) : cameraPermission !== 'granted' ? (
                  <Button size="sm" onClick={requestCameraPermission}>
                    Request Access
                  </Button>
                ) : null}
              </div>
            </div>

            <SettingToggle
              icon={Mic}
              label="Auto-start recording"
              description="Begin capturing automatically when memo detects input."
              value={autoStartEnabled}
              onChange={() => handleToggle('autoStartRecording')}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recording</CardTitle>
            <CardDescription>Pick defaults for new sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Audio quality</label>
              <select
                value={settings.audioQuality}
                onChange={(e) => handleChange('audioQuality', e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/40"
              >
                <option value="low">Low (128 kbps)</option>
                <option value="medium">Medium (192 kbps)</option>
                <option value="high">High (320 kbps)</option>
              </select>
            </div>
            <SettingToggle
              icon={Mic}
              label="Auto transcribe"
              description="Send audio to Assembly after each session finishes."
              value={settings.autoTranscribe}
              onChange={() => handleToggle('autoTranscribe')}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Control how Memo-AI nudges you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingToggle
              icon={Bell}
              label="Enable notifications"
              description="Receive alerts when recording sessions change state."
              value={settings.notifications}
              onChange={() => handleToggle('notifications')}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Calendar sync</CardTitle>
            <CardDescription>Import upcoming meetings from the macOS Calendar app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingToggle
              icon={CalendarIcon}
              label="Import Calendar events"
              description="Allow Memo-AI to read your meetings and show them inside the Calendar view."
              value={settings.importCalendarEvents}
              onChange={() => handleToggle('importCalendarEvents')}
            />
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-xs text-slate-500">
              <span>Fetch upcoming events from Calendar and store them locally.</span>
              <Button
                size="sm"
                className="shrink-0 bg-slate-900 text-white hover:bg-slate-800"
                onClick={handleSyncCalendarEvents}
                disabled={!settings.importCalendarEvents || syncStatus === 'loading'}
              >
                {syncStatus === 'loading'
                  ? 'Syncing…'
                  : syncStatus === 'success'
                  ? 'Synced!'
                  : syncStatus === 'error'
                  ? 'Error'
                  : 'Sync calendar'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              When enabled, macOS will ask for permission to allow Memo-AI to read your Calendar data.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Storage</CardTitle>
            <CardDescription>Where finished files should live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Save location</label>
              <div className="flex items-center gap-2">
                <Input
                  value={settings.saveLocation}
                  onChange={(e) => handleChange('saveLocation', e.target.value)}
                  className="border-slate-200"
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="shrink-0 border-slate-300"
                  onClick={handleBrowseForSaveLocation}
                >
                  Browse
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Match Memo-AI to your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/40"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>Project details at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-medium text-slate-900">0.0.1</span>
            </div>
            <div className="flex justify-between">
              <span>Build</span>
              <span className="font-medium text-slate-900">2025.11.09</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

