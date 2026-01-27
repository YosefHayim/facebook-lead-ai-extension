import { Save } from 'lucide-react';
import type { ExtensionSettings } from '../../../src/types';

interface GeneralTabProps {
  settings: ExtensionSettings;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
  onSaveApiKey: () => void;
}

export function GeneralTab({ settings, apiKey, setApiKey, onSettingChange, onSaveApiKey }: GeneralTabProps) {
  return (
    <div className="space-y-6">
      <AIConfigSection
        settings={settings}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSettingChange={onSettingChange}
        onSaveApiKey={onSaveApiKey}
      />
      <ScanningOptionsSection settings={settings} onSettingChange={onSettingChange} />
      <TransparencySection settings={settings} onSettingChange={onSettingChange} />
    </div>
  );
}

interface AIConfigSectionProps {
  settings: ExtensionSettings;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
  onSaveApiKey: () => void;
}

function AIConfigSection({ settings, apiKey, setApiKey, onSettingChange, onSaveApiKey }: AIConfigSectionProps) {
  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">AI Configuration</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">AI Provider</label>
          <select
            value={settings.aiProvider}
            onChange={(e) => onSettingChange('aiProvider', e.target.value)}
            className="w-full border border-border bg-card-elevated text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-foreground-muted"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI GPT-4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-2">API Key</label>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${settings.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
              className="flex-1 border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm placeholder:text-foreground-muted focus:outline-none focus:border-foreground-muted"
            />
            <button
              onClick={onSaveApiKey}
              className="px-4 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-accent-hover flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ScanningOptionsSectionProps {
  settings: ExtensionSettings;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
}

function ScanningOptionsSection({ settings, onSettingChange }: ScanningOptionsSectionProps) {
  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">Scanning Options</h2>
      <div className="space-y-4">
        <ToggleOption
          label="Enable Lead Scanning"
          description="Automatically detect leads on Facebook"
          checked={settings.isEnabled}
          onChange={(v) => onSettingChange('isEnabled', v)}
        />
        <ToggleOption
          label="Auto-Analyze with AI"
          description="Automatically classify intent and generate replies"
          checked={settings.autoAnalyze}
          onChange={(v) => onSettingChange('autoAnalyze', v)}
        />
        <ToggleOption
          label="Show Overlay on Facebook"
          description="Display lead indicators directly on posts"
          checked={settings.showOverlay}
          onChange={(v) => onSettingChange('showOverlay', v)}
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground-secondary">Minimum Lead Score</label>
            <span className="text-sm text-foreground font-medium">{settings.minLeadScore}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.minLeadScore}
            onChange={(e) => onSettingChange('minLeadScore', parseInt(e.target.value))}
            className="w-full h-2 bg-card-elevated rounded-lg appearance-none cursor-pointer accent-foreground"
          />
          <p className="text-xs text-foreground-muted mt-1">Only show leads with confidence score above this threshold</p>
        </div>
      </div>
    </section>
  );
}

interface TransparencySectionProps {
  settings: ExtensionSettings;
  onSettingChange: (key: keyof ExtensionSettings, value: unknown) => void;
}

function TransparencySection({ settings, onSettingChange }: TransparencySectionProps) {
  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-medium text-foreground mb-4">Transparency & Disclosure</h2>
      <div className="space-y-4">
        <ToggleOption
          label="Add AI Disclosure to Replies"
          description="Append transparency text to generated replies"
          checked={settings.transparencyEnabled}
          onChange={(v) => onSettingChange('transparencyEnabled', v)}
        />
        {settings.transparencyEnabled && (
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">Disclosure Text</label>
            <input
              type="text"
              value={settings.transparencyText}
              onChange={(e) => onSettingChange('transparencyText', e.target.value)}
              placeholder="[AI-assisted response]"
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm placeholder:text-foreground-muted focus:outline-none focus:border-foreground-muted"
            />
            <p className="text-xs text-foreground-muted mt-1">This text will be appended to all AI-generated replies</p>
          </div>
        )}
      </div>
    </section>
  );
}

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex items-center justify-between p-3 bg-card-elevated rounded-lg cursor-pointer">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded accent-foreground"
      />
    </label>
  );
}
