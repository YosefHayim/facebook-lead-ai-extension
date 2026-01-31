import { useState } from 'react';
import { Clock, RefreshCw, Timer, Zap, Search } from 'lucide-react';
import { useAutomation } from '../../../src/hooks/useAutomation';
import type { ScheduledTask } from '../../../src/types';

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

const GROUPS_PER_CYCLE_OPTIONS = [1, 2, 3, 5, 10];

const DELAY_OPTIONS = [
  { min: 3, max: 8, label: '3-8 sec' },
  { min: 5, max: 15, label: '5-15 sec' },
  { min: 10, max: 30, label: '10-30 sec' },
  { min: 15, max: 45, label: '15-45 sec' },
];

export function AutomationTab() {
  const {
    settings,
    pendingTasks,
    updateSettings,
  } = useAutomation();

  const [isSaving, setIsSaving] = useState(false);

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-8 text-foreground-muted">
        Loading...
      </div>
    );
  }

  const handleToggleEnabled = async () => {
    await updateSettings({ enabled: !settings.enabled });
  };

  const handleIntervalChange = (value: number) => {
    updateSettings({ scanIntervalMinutes: value });
  };

  const handleGroupsChange = (value: number) => {
    updateSettings({ groupsPerCycle: value });
  };

  const handleDelayChange = (min: number, max: number) => {
    updateSettings({ delayMinSeconds: min, delayMaxSeconds: max });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
  };

  const isPro = settings.isPro;

  return (
    <div className="space-y-4">
      {!isPro && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-foreground-secondary" />
            <span className="font-semibold text-foreground">PRO Feature</span>
          </div>
          <p className="text-sm text-foreground-secondary">
            Upgrade to PRO to enable automated scanning and group rotation.
          </p>
        </div>
      )}

      <ScheduleCard
        enabled={settings.enabled}
        interval={settings.scanIntervalMinutes}
        onToggle={handleToggleEnabled}
        onIntervalChange={handleIntervalChange}
        disabled={!isPro}
      />

      <GroupRotationCard
        groupsPerCycle={settings.groupsPerCycle}
        onGroupsChange={handleGroupsChange}
        disabled={!isPro}
      />

      <DelayCard
        minDelay={settings.delayMinSeconds}
        maxDelay={settings.delayMaxSeconds}
        onDelayChange={handleDelayChange}
        disabled={!isPro}
      />

      {pendingTasks.length > 0 && (
        <QueueCard tasks={pendingTasks} />
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || !isPro}
        className="w-full bg-foreground hover:bg-accent-hover disabled:bg-card-elevated disabled:cursor-not-allowed text-background font-semibold py-3 rounded-xl transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

interface ScheduleCardProps {
  enabled: boolean;
  interval: number;
  onToggle: () => void;
  onIntervalChange: (value: number) => void;
  disabled: boolean;
}

function ScheduleCard({ enabled, interval, onToggle, onIntervalChange, disabled }: ScheduleCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-foreground-secondary" />
          <span className="font-semibold text-foreground">Scheduled Scans</span>
        </div>
        <ToggleSwitch enabled={enabled} onToggle={onToggle} disabled={disabled} />
      </div>
      <p className="text-sm text-foreground-muted">
        Automatically scan your groups at set intervals
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-muted">Scan Interval</span>
        <select
          value={interval}
          onChange={(e) => onIntervalChange(Number(e.target.value))}
          disabled={disabled}
          className="bg-card-elevated border border-border text-foreground rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          {INTERVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface GroupRotationCardProps {
  groupsPerCycle: number;
  onGroupsChange: (value: number) => void;
  disabled: boolean;
}

function GroupRotationCard({ groupsPerCycle, onGroupsChange, disabled }: GroupRotationCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-foreground-secondary" />
        <span className="font-semibold text-foreground">Group Rotation</span>
      </div>
      <p className="text-sm text-foreground-muted">
        Cycle through groups to avoid detection
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-muted">Groups per cycle</span>
        <select
          value={groupsPerCycle}
          onChange={(e) => onGroupsChange(Number(e.target.value))}
          disabled={disabled}
          className="bg-card-elevated border border-border text-foreground rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          {GROUPS_PER_CYCLE_OPTIONS.map((num) => (
            <option key={num} value={num}>
              {num} groups
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface DelayCardProps {
  minDelay: number;
  maxDelay: number;
  onDelayChange: (min: number, max: number) => void;
  disabled: boolean;
}

function DelayCard({ minDelay, maxDelay, onDelayChange, disabled }: DelayCardProps) {
  const currentLabel = `${minDelay}-${maxDelay} sec`;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Timer className="w-5 h-5 text-foreground-secondary" />
        <span className="font-semibold text-foreground">Action Delays</span>
      </div>
      <p className="text-sm text-foreground-muted">
        Human-like delays between actions
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-muted">Delay range</span>
        <select
          value={currentLabel}
          onChange={(e) => {
            const selected = DELAY_OPTIONS.find((o) => `${o.min}-${o.max} sec` === e.target.value);
            if (selected) onDelayChange(selected.min, selected.max);
          }}
          disabled={disabled}
          className="bg-card-elevated border border-border text-foreground rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          {DELAY_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface QueueCardProps {
  tasks: ScheduledTask[];
}

function QueueCard({ tasks }: QueueCardProps) {
  const visibleTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - visibleTasks.length;

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-foreground-secondary" />
          <span className="font-semibold text-foreground">Action Queue</span>
        </div>
        <span className="text-xs bg-card-elevated text-foreground-secondary px-2 py-1 rounded-full">
          {tasks.length} pending
        </span>
      </div>

      <div className="space-y-2">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 bg-card-elevated rounded-lg p-3"
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-foreground-secondary">
              <Search className="w-4 h-4 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {task.groupName || 'Scan Group'}
              </p>
              <p className="text-xs text-foreground-muted">
                {task.status === 'running' ? 'Running...' : formatScheduledTime(task.scheduledAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {remainingCount > 0 && (
        <p className="text-xs text-center text-foreground-muted">
          +{remainingCount} more tasks in queue
        </p>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function ToggleSwitch({ enabled, onToggle, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-foreground' : 'bg-card-elevated'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function formatScheduledTime(timestamp: number): string {
  const diff = timestamp - Date.now();
  if (diff <= 0) return 'Now';
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `in ${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  return `in ${hours}h`;
}
