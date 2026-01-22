import { useState, useEffect } from 'react';
import { TrendingUp, Users, User, Settings, Github, Coffee, Linkedin, Heart } from 'lucide-react';
import { useSidepanelData } from '../../src/hooks/useSidepanelData';
import { onboardingCompleteStorage } from '../../src/lib/storage';
import { Header, ScanButton, LeadsTab, GroupsTab, PersonasTab, SettingsTab, Onboarding } from './components';

type Tab = 'leads' | 'groups' | 'personas' | 'settings';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={() => setOnboardingComplete(true)} />;
  }

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
      <Footer />
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

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          <span>by</span>
          <a
            href="https://github.com/YosefHayim"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 hover:text-blue-600"
          >
            Yosef
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/YosefHayim"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href="https://buymeacoffee.com/yosefhayim"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-amber-500 transition-colors"
            title="Buy me a coffee"
          >
            <Coffee className="w-4 h-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/yosef-hayim-sabag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
