import { useState, useEffect } from 'react';
import {
  leadsStorage,
  personasStorage,
  activePersonaIdStorage,
  settingsStorage,
  usageStorage,
  watchedGroupsStorage,
  sessionLimitsStorage,
} from '../lib/storage';
import type { Lead, Persona, ExtensionSettings, UsageData, WatchedGroup, SessionLimits } from '../types';

export interface SidepanelData {
  leads: Lead[];
  personas: Persona[];
  activePersonaId: string;
  settings: ExtensionSettings | null;
  usage: UsageData | null;
  groups: WatchedGroup[];
  sessionLimits: SessionLimits | null;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export function useSidepanelData(): SidepanelData {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string>('default');
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [groups, setGroups] = useState<WatchedGroup[]>([]);
  const [sessionLimits, setSessionLimits] = useState<SessionLimits | null>(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [
        loadedLeads,
        loadedPersonas,
        loadedActiveId,
        loadedSettings,
        loadedUsage,
        loadedGroups,
        loadedLimits,
      ] = await Promise.all([
        leadsStorage.getValue(),
        personasStorage.getValue(),
        activePersonaIdStorage.getValue(),
        settingsStorage.getValue(),
        usageStorage.getValue(),
        watchedGroupsStorage.getValue(),
        sessionLimitsStorage.getValue(),
      ]);

      setLeads(loadedLeads);
      setPersonas(loadedPersonas);
      setActivePersonaId(loadedActiveId);
      setSettings(loadedSettings);
      setUsage(loadedUsage);
      setGroups(loadedGroups);
      setSessionLimits(loadedLimits);

      const result = await browser.runtime.sendMessage({
        type: 'GET_API_KEY',
        provider: loadedSettings.aiProvider,
      });
      if (result?.apiKey) setApiKey(result.apiKey);
    };

    loadData();

    const unwatchLeads = leadsStorage.watch((newLeads) => {
      if (newLeads) setLeads(newLeads);
    });

    const unwatchGroups = watchedGroupsStorage.watch((newGroups) => {
      if (newGroups) setGroups(newGroups);
    });

    const unwatchLimits = sessionLimitsStorage.watch((newLimits) => {
      if (newLimits) setSessionLimits(newLimits);
    });

    return () => {
      unwatchLeads();
      unwatchGroups();
      unwatchLimits();
    };
  }, []);

  return {
    leads,
    personas,
    activePersonaId,
    settings,
    usage,
    groups,
    sessionLimits,
    apiKey,
    setApiKey,
  };
}
