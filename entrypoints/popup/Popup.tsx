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
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-gray-900">LeadScout AI</span>
        </div>
        <button
          onClick={toggleEnabled}
          className={`p-2 rounded-full transition-colors ${
            settings.isEnabled
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <TrendingUp className="w-3 h-3" />
            Total Leads
          </div>
          <div className="text-2xl font-semibold text-gray-900">{leadCount}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-blue-600 text-xs mb-1">
            <Sparkles className="w-3 h-3" />
            New Today
          </div>
          <div className="text-2xl font-semibold text-blue-600">{newLeadCount}</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-4">
        <div className="flex justify-between">
          <span>Leads found today:</span>
          <span>{usage.leadsFoundToday}</span>
        </div>
        <div className="flex justify-between">
          <span>AI calls today:</span>
          <span>{usage.aiCallsToday}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={openSidePanel}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Open Dashboard
        </button>
        <button
          onClick={openFacebook}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Browse Facebook Groups
        </button>
      </div>
      
      {!settings.isEnabled && (
        <p className="text-xs text-center text-amber-600 mt-3">
          Lead scanning is disabled
        </p>
      )}
    </div>
  );
}
