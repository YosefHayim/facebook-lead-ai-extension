import {
  automationSettingsStorage,
  automationStateStorage,
  watchedGroupsStorage,
  addScheduledTask,
  updateScheduledTask,
  getNextScheduledTask,
  clearCompletedTasks,
} from './storage';
import type { AutomationSettings, AutomationState, ScheduledTask } from '../types';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export async function startScheduler(): Promise<void> {
  const settings = await automationSettingsStorage.getValue();
  if (!settings.enabled || !settings.isPro) return;

  await stopScheduler();
  
  const state = await automationStateStorage.getValue();
  await automationStateStorage.setValue({
    ...state,
    isRunning: true,
    startedAt: Date.now(),
  });

  await scheduleNextCycle();

  schedulerInterval = setInterval(async () => {
    await processQueue();
  }, 10000);
}

export async function stopScheduler(): Promise<void> {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  const state = await automationStateStorage.getValue();
  await automationStateStorage.setValue({
    ...state,
    isRunning: false,
    currentTaskId: undefined,
  });
}

export async function scheduleNextCycle(): Promise<void> {
  const settings = await automationSettingsStorage.getValue();
  const groups = await watchedGroupsStorage.getValue();
  const activeGroups = groups.filter(g => g.isActive);

  if (activeGroups.length === 0) return;

  activeGroups.sort((a, b) => (a.lastVisited || 0) - (b.lastVisited || 0));

  const groupsToScan = activeGroups.slice(0, settings.groupsPerCycle);
  const now = Date.now();

  for (let i = 0; i < groupsToScan.length; i++) {
    const group = groupsToScan[i];
    const delay = calculateHumanDelay(settings, i);
    
    await addScheduledTask({
      type: 'scan_group',
      groupId: group.id,
      groupName: group.name,
      scheduledAt: now + delay,
      status: 'pending',
    });
  }

  await automationSettingsStorage.setValue({
    ...settings,
    lastScanAt: now,
  });
}

function calculateHumanDelay(settings: AutomationSettings, index: number): number {
  const baseDelay = index * (settings.delayMinSeconds + settings.delayMaxSeconds) * 500;
  const jitter = Math.random() * (settings.delayMaxSeconds - settings.delayMinSeconds) * 1000;
  return baseDelay + jitter;
}

export async function processQueue(): Promise<void> {
  const state = await automationStateStorage.getValue();
  if (!state.isRunning) return;

  const task = await getNextScheduledTask();
  if (!task) {
    const settings = await automationSettingsStorage.getValue();
    const timeSinceLastScan = Date.now() - (settings.lastScanAt || 0);
    const intervalMs = settings.scanIntervalMinutes * 60 * 1000;
    
    if (timeSinceLastScan >= intervalMs) {
      await clearCompletedTasks();
      await scheduleNextCycle();
    }
    return;
  }

  await automationStateStorage.setValue({
    ...state,
    currentTaskId: task.id,
  });

  await updateScheduledTask(task.id, { status: 'running' });

  try {
    await executeTask(task);
    await updateScheduledTask(task.id, { status: 'completed' });
    
    const updatedState = await automationStateStorage.getValue();
    await automationStateStorage.setValue({
      ...updatedState,
      completedCount: updatedState.completedCount + 1,
      currentTaskId: undefined,
    });
  } catch (error) {
    console.error('Task execution failed:', error);
    await updateScheduledTask(task.id, { status: 'failed' });
    
    const updatedState = await automationStateStorage.getValue();
    await automationStateStorage.setValue({
      ...updatedState,
      failedCount: updatedState.failedCount + 1,
      currentTaskId: undefined,
    });
  }
}

async function executeTask(task: ScheduledTask): Promise<void> {
  if (task.type === 'scan_group' && task.groupId) {
    const groups = await watchedGroupsStorage.getValue();
    const group = groups.find(g => g.id === task.groupId);
    
    if (group) {
      chrome.runtime.sendMessage({
        type: 'AUTOMATION_SCAN_GROUP',
        groupId: group.id,
        groupUrl: group.url,
      });
    }
  }
}

export async function getSchedulerStatus(): Promise<{
  isRunning: boolean;
  settings: AutomationSettings;
  state: AutomationState;
  pendingTasks: ScheduledTask[];
}> {
  const settings = await automationSettingsStorage.getValue();
  const state = await automationStateStorage.getValue();
  const pendingTasks = state.queue.filter(t => t.status === 'pending' || t.status === 'running');

  return {
    isRunning: state.isRunning,
    settings,
    state,
    pendingTasks,
  };
}

export async function updateAutomationSettings(updates: Partial<AutomationSettings>): Promise<void> {
  const settings = await automationSettingsStorage.getValue();
  await automationSettingsStorage.setValue({ ...settings, ...updates });
  
  if (updates.enabled !== undefined) {
    if (updates.enabled && settings.isPro) {
      await startScheduler();
    } else if (!updates.enabled) {
      await stopScheduler();
    }
  }
}

export function getTimeUntilNextScan(settings: AutomationSettings): number {
  if (!settings.lastScanAt) return 0;
  const intervalMs = settings.scanIntervalMinutes * 60 * 1000;
  const elapsed = Date.now() - settings.lastScanAt;
  return Math.max(0, intervalMs - elapsed);
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Now';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
