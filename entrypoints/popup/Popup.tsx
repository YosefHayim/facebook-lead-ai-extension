import { useState, useEffect } from 'react';
import { leadsStorage, settingsStorage, usageStorage } from '../../src/lib/storage';
import type { ExtensionSettings, UsageData } from '../../src/types';
import { Sparkles, TrendingUp, Power, ExternalLink } from 'lucide-react';

export function Popup() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [newLeadCount, setNewLeadCount] = useState(0);
  
  useEffect(() => {
    const loadData = async () => {
      const [loadedSettings, loadedUsage, leads] = await Promise.all([
        settingsStorage.getValue(),
        usageStorage.getValue(),
        leadsStorage.getValue(),
      ]);
      
      setSettings(loadedSettings);
      setUsage(loadedUsage);
      setLeadCount(leads.length);
      setNewLeadCount(leads.filter(l => l.status === 'new').length);
    };
    
    loadData();
  }, []);
  
  const toggleEnabled = async () => {
    if (settings) {
      const updated = { ...settings, isEnabled: !settings.isEnabled };
      await settingsStorage.setValue(updated);
      setSettings(updated);
    }
  };
  
  const openSidePanel = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };
  
  const openFacebook = () => {
    browser.tabs.create({ url: 'https://www.facebook.com/groups/feed/' });
    window.close();
  };
  
  if (!settings || !usage) {
    return (
      <div className="p-4 flex items-center justify-center bg-background min-h-[200px]">
        <div className="animate-pulse text-foreground-muted">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-foreground" />
          <span className="font-semibold text-foreground">LeadScout AI</span>
        </div>
        <button
          onClick={toggleEnabled}
          className={`p-2 rounded-full transition-colors ${
            settings.isEnabled
              ? 'bg-card-elevated text-foreground hover:bg-zinc-600'
              : 'bg-card text-foreground-muted hover:bg-card-elevated'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center gap-1.5 text-foreground-muted text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Total Leads
          </div>
          <div className="text-2xl font-semibold text-foreground">{leadCount}</div>
        </div>
        <div className="bg-card-elevated rounded-xl p-3 border border-border">
          <div className="flex items-center gap-1.5 text-foreground-secondary text-xs mb-1">
            <Sparkles className="w-3 h-3" />
            New Today
          </div>
          <div className="text-2xl font-semibold text-foreground">{newLeadCount}</div>
        </div>
      </div>
      
      <div className="text-xs text-foreground-muted mb-4">
        <div className="flex justify-between">
          <span>Leads found today:</span>
          <span className="text-foreground-secondary">{usage.leadsFoundToday}</span>
        </div>
        <div className="flex justify-between">
          <span>AI calls today:</span>
          <span className="text-foreground-secondary">{usage.aiCallsToday}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={openSidePanel}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors"
        >
          Open Dashboard
        </button>
        <button
          onClick={openFacebook}
          className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground-secondary py-2.5 px-4 rounded-xl hover:bg-card-elevated hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Browse Facebook Groups
        </button>
      </div>
      
      {!settings.isEnabled && (
        <p className="text-xs text-center text-foreground-muted mt-3">
          Lead scanning is disabled
        </p>
      )}
    </div>
  );
}
