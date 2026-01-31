import { useState, useEffect, useCallback } from 'react';
import { automationSettingsStorage, automationStateStorage } from '../lib/storage';
import type { AutomationSettings, AutomationState, ScheduledTask } from '../types';
import { formatTimeRemaining, getTimeUntilNextScan } from '../lib/scheduler';

export function useAutomation() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [state, setState] = useState<AutomationState | null>(null);
  const [timeUntilNextScan, setTimeUntilNextScan] = useState<string>('');

  useEffect(() => {
    automationSettingsStorage.getValue().then(setSettings);
    automationStateStorage.getValue().then(setState);

    const unsubSettings = automationSettingsStorage.watch((newSettings) => {
      setSettings(newSettings);
    });

    const unsubState = automationStateStorage.watch((newState) => {
      setState(newState);
    });

    return () => {
      unsubSettings();
      unsubState();
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    const updateTimer = () => {
      const remaining = getTimeUntilNextScan(settings);
      setTimeUntilNextScan(formatTimeRemaining(remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  const updateSettings = useCallback(async (updates: Partial<AutomationSettings>) => {
    await chrome.runtime.sendMessage({
      type: 'UPDATE_AUTOMATION_SETTINGS',
      settings: updates,
    });
  }, []);

  const startAutomation = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: 'START_SCHEDULER' });
  }, []);

  const stopAutomation = useCallback(async () => {
    await chrome.runtime.sendMessage({ type: 'STOP_SCHEDULER' });
  }, []);

  const pendingTasks = state?.queue.filter(
    (t: ScheduledTask) => t.status === 'pending' || t.status === 'running'
  ) || [];

  return {
    settings,
    state,
    pendingTasks,
    timeUntilNextScan,
    updateSettings,
    startAutomation,
    stopAutomation,
    isRunning: state?.isRunning || false,
  };
}
