import { useState, useEffect } from 'react';
import { settingsStorage, personasStorage, activePersonaIdStorage, leadsStorage } from '../../src/lib/storage';
import { supabaseAuth, authSessionStorage, userSubscriptionStorage } from '../../src/lib/supabase';
import type { ExtensionSettings, Persona, UserSubscription } from '../../src/types';
import type { User } from '@supabase/supabase-js';
import { Sparkles, Settings, User as UserIcon, Shield, Zap, Check } from 'lucide-react';
import { GeneralTab, PersonasTab, AccountTab, AboutTab } from './components';

type Tab = 'general' | 'personas' | 'account' | 'about';

export function OptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string>('default');
  const [apiKey, setApiKey] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    loadInitialData();
    const unwatch = authSessionStorage.watch(async () => {
      const currentUser = await supabaseAuth.getCurrentUser();
      setUser(currentUser);
    });
    return () => unwatch();
  }, []);

  const loadInitialData = async () => {
    const [loadedSettings, loadedPersonas, loadedActiveId, leads] = await Promise.all([
      settingsStorage.getValue(),
      personasStorage.getValue(),
      activePersonaIdStorage.getValue(),
      leadsStorage.getValue(),
    ]);
    setSettings(loadedSettings);
    setPersonas(loadedPersonas);
    setActivePersonaId(loadedActiveId);
    setLeadsCount(leads.length);

    const result = await browser.runtime.sendMessage({ type: 'GET_API_KEY', provider: loadedSettings.aiProvider });
    if (result?.apiKey) setApiKey(result.apiKey);

    await supabaseAuth.init();
    const currentUser = await supabaseAuth.getCurrentUser();
    setUser(currentUser);
    const sub = await userSubscriptionStorage.getValue();
    setSubscription(sub);
  };

  const handleSettingChange = async (key: keyof ExtensionSettings, value: unknown) => {
    if (!settings) return;
    setSaveStatus('saving');
    const updated = { ...settings, [key]: value };
    await settingsStorage.setValue(updated);
    setSettings(updated);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const handleSaveApiKey = async () => {
    if (!settings) return;
    setSaveStatus('saving');
    await browser.runtime.sendMessage({ type: 'SET_API_KEY', provider: settings.aiProvider, apiKey });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1500);
  };

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user: authUser, error } = isSignUp
        ? await supabaseAuth.signUpWithEmail(email, password)
        : await supabaseAuth.signInWithEmail(email, password);
      if (error) setAuthError(error.message);
      else if (authUser) { setUser(authUser); setEmail(''); setPassword(''); }
    } catch { setAuthError('Authentication failed'); }
    finally { setAuthLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabaseAuth.signInWithGoogle();
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabaseAuth.signOut();
    setUser(null);
    setSubscription(null);
  };

  const handleSyncToCloud = async () => {
    const leads = await leadsStorage.getValue();
    await supabaseAuth.syncLeadsToCloud(leads);
    await supabaseAuth.syncPersonasToCloud(personas);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header saveStatus={saveStatus} />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 min-w-0">
            {activeTab === 'general' && settings && (
              <GeneralTab
                settings={settings}
                apiKey={apiKey}
                setApiKey={setApiKey}
                onSettingChange={handleSettingChange}
                onSaveApiKey={handleSaveApiKey}
              />
            )}
            {activeTab === 'personas' && (
              <PersonasTab
                personas={personas}
                activePersonaId={activePersonaId}
                setPersonas={setPersonas}
                setActivePersonaId={setActivePersonaId}
              />
            )}
            {activeTab === 'account' && (
              <AccountTab
                user={user}
                subscription={subscription}
                leadsCount={leadsCount}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                authError={authError}
                authLoading={authLoading}
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                onAuth={handleAuth}
                onGoogleAuth={handleGoogleAuth}
                onSignOut={handleSignOut}
                onSyncToCloud={handleSyncToCloud}
              />
            )}
            {activeTab === 'about' && <AboutTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Header({ saveStatus }: { saveStatus: 'idle' | 'saving' | 'saved' }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">LeadScout AI</h1>
              <p className="text-sm text-gray-500">Extension Settings</p>
            </div>
          </div>
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const tabs = [
    { id: 'general' as const, icon: Settings, label: 'General' },
    { id: 'personas' as const, icon: UserIcon, label: 'Personas' },
    { id: 'account' as const, icon: Shield, label: 'Account' },
    { id: 'about' as const, icon: Zap, label: 'About' },
  ];

  return (
    <nav className="w-48 flex-shrink-0">
      <ul className="space-y-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <li key={id}>
            <button
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
