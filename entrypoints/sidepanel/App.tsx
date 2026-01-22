import { useState } from 'react';
import { TrendingUp, Users, User, Settings } from 'lucide-react';
import { useSidepanelData } from '../../src/hooks/useSidepanelData';
import { Header, ScanButton, LeadsTab, GroupsTab, PersonasTab, SettingsTab } from './components';

type Tab = 'leads' | 'groups' | 'personas' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const {
    leads,
    personas,
    activePersonaId,
    settings,
    usage,
    groups,
    sessionLimits,
    apiKey,
    setApiKey,
  } = useSidepanelData();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header sessionLimits={sessionLimits} usage={usage} />
      <ScanButton sessionLimits={sessionLimits} />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'leads' && <LeadsTab leads={leads} />}
        {activeTab === 'groups' && <GroupsTab groups={groups} />}
        {activeTab === 'personas' && (
          <PersonasTab personas={personas} activePersonaId={activePersonaId} />
        )}
        {activeTab === 'settings' && settings && sessionLimits && (
          <SettingsTab
            settings={settings}
            sessionLimits={sessionLimits}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>
    </div>
  );
}

interface TabNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: 'leads' as const, icon: TrendingUp, label: 'Leads' },
    { id: 'groups' as const, icon: Users, label: 'Groups' },
    { id: 'personas' as const, icon: User, label: 'Personas' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-2">
      <div className="flex gap-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
