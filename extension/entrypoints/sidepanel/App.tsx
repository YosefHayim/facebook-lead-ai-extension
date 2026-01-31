import { useState, useEffect } from 'react';
import { TrendingUp, Users, User, Settings, Zap } from 'lucide-react';
import { useSidepanelData } from '../../src/hooks/useSidepanelData';
import { onboardingCompleteStorage } from '../../src/lib/storage';
import { Header, ScanButton, LeadsTab, GroupsTab, PersonasTab, SettingsTab, Onboarding, AutomationTab } from './components';

type Tab = 'leads' | 'spy' | 'groups' | 'personas' | 'settings';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
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

  useEffect(() => {
    onboardingCompleteStorage.getValue().then(setOnboardingComplete);
  }, []);

  const isLoadingOnboardingState = onboardingComplete === null;
  const needsOnboarding = onboardingComplete === false;

  if (isLoadingOnboardingState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground-muted">Loading...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header sessionLimits={sessionLimits} usage={usage} />
      <ScanButton sessionLimits={sessionLimits} />

      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'leads' && <LeadsTab leads={leads} />}
        {activeTab === 'spy' && <AutomationTab />}
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
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'leads' as const, icon: TrendingUp, label: 'Leads' },
    { id: 'spy' as const, icon: Zap, label: 'Spy' },
    { id: 'groups' as const, icon: Users, label: 'Groups' },
    { id: 'personas' as const, icon: User, label: 'Personas' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-background-secondary border-t border-border h-16 flex items-center justify-around px-6">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === id
              ? 'text-foreground'
              : 'text-foreground-muted hover:text-foreground-secondary'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
