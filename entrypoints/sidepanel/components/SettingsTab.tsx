import { Clock, Users, Pause } from 'lucide-react';
import { settingsStorage } from '../../../src/lib/storage';
import type { ExtensionSettings, SessionLimits } from '../../../src/types';

interface SettingsTabProps {
  settings: ExtensionSettings;
  sessionLimits: SessionLimits;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export function SettingsTab({ settings, sessionLimits, apiKey, setApiKey }: SettingsTabProps) {
  const handleSettingChange = async (key: keyof ExtensionSettings, value: unknown) => {
    const updated = { ...settings, [key]: value };
    await settingsStorage.setValue(updated);
  };

  const handleSaveApiKey = async () => {
    await browser.runtime.sendMessage({ type: 'SET_API_KEY', provider: settings.aiProvider, apiKey });
  };

  const handleResetLimits = async () => {
    await browser.runtime.sendMessage({ type: 'RESET_SESSION_LIMITS' });
  };

  return (
    <div className="space-y-6">
      <SessionLimitsCard sessionLimits={sessionLimits} onReset={handleResetLimits} />
      <AIConfigCard
        settings={settings}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSettingChange={handleSettingChange}
        onSaveApiKey={handleSaveApiKey}
      />
      <ScanningOptionsCard settings={settings} onSettingChange={handleSettingChange} />
    </div>
  );
}

interface SessionLimitsCardProps {
  sessionLimits: SessionLimits;
  onReset: () => void;
}

function SessionLimitsCard({ sessionLimits, onReset }: SessionLimitsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Session Limits</h3>
        <button onClick={onReset} className="text-xs text-blue-600 hover:text-blue-700">
          Reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span>Posts/Hour</span>
          </div>
          <p className="text-lg font-medium text-gray-900">
            {sessionLimits.postsScannedThisHour} / {sessionLimits.maxPostsPerHour}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span>Groups/Day</span>
          </div>
          <p className="text-lg font-medium text-gray-900">
            {sessionLimits.groupsVisitedToday} / {sessionLimits.maxGroupsPerDay}
          </p>
        </div>
      </div>
      {sessionLimits.isPaused && sessionLimits.pausedUntil && (
        <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded">
          <Pause className="w-4 h-4" />
          Paused until {new Date(sessionLimits.pausedUntil).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

interface AIConfigCardProps {
  settings: ExtensionSettings;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
  onSaveApiKey: () => void;
}

function AIConfigCard({ settings, apiKey, setApiKey, onSettingChange, onSaveApiKey }: AIConfigCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4">AI Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
          <select
            value={settings.aiProvider}
            onChange={(e) => onSettingChange('aiProvider', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${settings.aiProvider} API key`}
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={onSaveApiKey}
              className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScanningOptionsCardProps {
  settings: ExtensionSettings;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
}

function ScanningOptionsCard({ settings, onSettingChange }: ScanningOptionsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-4">Scanning Options</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scan Mode</label>
          <select
            value={settings.scanMode}
            onChange={(e) => onSettingChange('scanMode', e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="manual">Manual (Recommended)</option>
            <option value="auto">Automatic</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Manual mode is safer and more Facebook-compliant</p>
        </div>
        <CheckboxSetting
          checked={settings.isEnabled}
          onChange={(v) => onSettingChange('isEnabled', v)}
          label="Enable extension"
        />
        <CheckboxSetting
          checked={settings.autoAnalyze}
          onChange={(v) => onSettingChange('autoAnalyze', v)}
          label="Auto-analyze with AI"
        />
        <CheckboxSetting
          checked={settings.showOverlay}
          onChange={(v) => onSettingChange('showOverlay', v)}
          label="Show overlay on Facebook"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum lead score: {settings.minLeadScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.minLeadScore}
            onChange={(e) => onSettingChange('minLeadScore', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <CheckboxSetting
          checked={settings.transparencyEnabled}
          onChange={(v) => onSettingChange('transparencyEnabled', v)}
          label="Add AI disclosure to replies"
        />
      </div>
    </div>
  );
}

interface CheckboxSettingProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function CheckboxSetting({ checked, onChange, label }: CheckboxSettingProps) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-500 rounded"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
