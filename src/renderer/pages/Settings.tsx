import { useState } from 'react';
import { Save, Bell, Volume2, Mic } from 'lucide-react';

interface SettingsState {
  autoTranscribe: boolean;
  notifications: boolean;
  saveLocation: string;
  audioQuality: string;
  theme: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    autoTranscribe: true,
    notifications: true,
    saveLocation: '/Documents/MemoAI',
    audioQuality: 'high',
    theme: 'dark',
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      await window.electronAPI.saveSettings?.(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const SettingToggle = ({ 
    icon: Icon, 
    label, 
    description, 
    value, 
    onChange 
  }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <Icon size={20} className="text-gray-600 mt-1" />
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your MemoAI preferences</p>
      </div>

      {/* Main Settings */}
      <div className="max-w-2xl space-y-6">
        {/* Recording Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mic size={20} className="text-blue-600" />
            Recording Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Audio Quality
              </label>
              <select
                value={settings.audioQuality}
                onChange={(e) => handleChange('audioQuality', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="low">Low (128 kbps)</option>
                <option value="medium">Medium (192 kbps)</option>
                <option value="high">High (320 kbps)</option>
              </select>
            </div>
            <SettingToggle
              icon={Mic}
              label="Auto Transcribe"
              description="Automatically transcribe recordings after completion"
              value={settings.autoTranscribe}
              onChange={() => handleToggle('autoTranscribe')}
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-blue-600" />
            Notifications
          </h2>
          <div className="space-y-4">
            <SettingToggle
              icon={Bell}
              label="Enable Notifications"
              description="Receive notifications for recording events"
              value={settings.notifications}
              onChange={() => handleToggle('notifications')}
            />
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Storage</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Save Location
              </label>
              <input
                type="text"
                value={settings.saveLocation}
                onChange={(e) => handleChange('saveLocation', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Build</span>
              <span className="font-medium text-gray-900">2024.11.01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition"
        >
          <Save size={20} />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

