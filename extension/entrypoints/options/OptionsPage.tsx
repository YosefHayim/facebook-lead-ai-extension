import { AboutTab, AccountTab, GeneralTab, PersonasTab } from "./components";
import { Check, Settings, Shield, Sparkles, User as UserIcon, Zap } from "lucide-react";
import type { ExtensionSettings, Persona, UserSubscription } from "../../src/types";
import { activePersonaIdStorage, leadsStorage, personasStorage, settingsStorage } from "../../src/lib/storage";
import { authService, authStateStorage } from "../../src/lib/auth";
import { createLeadsBulk, createPersona } from "../../src/lib/api";
import { useEffect, useState } from "react";

import type { AuthUser } from "../../src/lib/auth";

type Tab = "general" | "personas" | "account" | "about";

function subscriptionFromUser(user: AuthUser | null): UserSubscription | null {
  if (!user) return null;
  return {
    plan: user.subscription.plan,
    leadsLimit: user.limits.leadsPerMonth,
    aiCallsLimit: user.limits.aiCallsPerMonth,
  };
}

export function OptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string>("default");
  const [apiKey, setApiKey] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [leadsCount, setLeadsCount] = useState(0);
  const subscription = subscriptionFromUser(user);

  useEffect(() => {
    loadInitialData();
    const unwatch = authStateStorage.watch(async (state) => {
      setUser(state?.user ?? null);
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

    const result = await browser.runtime.sendMessage({ type: "GET_API_KEY", provider: loadedSettings.aiProvider });
    if (result?.apiKey) setApiKey(result.apiKey);

    await authService.init();
    setUser(authService.getCurrentUser());
  };

  const handleSettingChange = async (key: keyof ExtensionSettings, value: unknown) => {
    if (!settings) return;
    setSaveStatus("saving");
    const updated = { ...settings, [key]: value };
    await settingsStorage.setValue(updated);
    setSettings(updated);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  const handleSaveApiKey = async () => {
    if (!settings) return;
    setSaveStatus("saving");
    await browser.runtime.sendMessage({ type: "SET_API_KEY", provider: settings.aiProvider, apiKey });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const { user: authUser, error } = await authService.signInWithGoogle();
    if (error) setAuthError(error.message);
    else if (authUser) setUser(authUser);
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const handleSyncToCloud = async () => {
    const leads = await leadsStorage.getValue();
    const apiLeads = leads.map((l) => ({
      postUrl: l.postUrl,
      postText: l.postText,
      authorName: l.authorName,
      authorProfileUrl: l.authorProfileUrl,
      groupName: l.groupName,
      intent: l.intent,
      leadScore: l.leadScore,
      aiAnalysis:
        l.aiAnalysis ?
          { intent: l.aiAnalysis.intent, confidence: l.aiAnalysis.confidence, reasoning: l.aiAnalysis.reasoning, keywords: l.aiAnalysis.keywords }
        : undefined,
      aiDraftReply: l.aiDraftReply,
      status: l.status,
      responseTracking:
        l.responseTracking ?
          {
            responded: l.responseTracking.responded,
            responseText: l.responseTracking.responseText,
            respondedAt: l.responseTracking.respondedAt ? new Date(l.responseTracking.respondedAt).toISOString() : undefined,
          }
        : undefined,
    }));
    if (apiLeads.length > 0) {
      await createLeadsBulk(apiLeads);
    }
    for (const p of personas) {
      await createPersona({
        name: p.name,
        role: p.role,
        keywords: p.keywords,
        negativeKeywords: p.negativeKeywords,
        aiTone: p.aiTone,
        valueProposition: p.valueProposition,
        signature: p.signature,
        isActive: p.isActive,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header saveStatus={saveStatus} />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 min-w-0">
            {activeTab === "general" && settings && (
              <GeneralTab settings={settings} apiKey={apiKey} setApiKey={setApiKey} onSettingChange={handleSettingChange} onSaveApiKey={handleSaveApiKey} />
            )}
            {activeTab === "personas" && (
              <PersonasTab personas={personas} activePersonaId={activePersonaId} setPersonas={setPersonas} setActivePersonaId={setActivePersonaId} />
            )}
            {activeTab === "account" && (
              <AccountTab
                user={user}
                subscription={subscription}
                leadsCount={leadsCount}
                authError={authError}
                authLoading={authLoading}
                onGoogleAuth={handleGoogleAuth}
                onSignOut={handleSignOut}
                onSyncToCloud={handleSyncToCloud}
              />
            )}
            {activeTab === "about" && <AboutTab />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Header({ saveStatus }: { saveStatus: "idle" | "saving" | "saved" }) {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">LeadScout AI</h1>
              <p className="text-sm text-foreground-muted">Extension Settings</p>
            </div>
          </div>
          {saveStatus === "saved" && (
            <div className="flex items-center gap-2 text-foreground-secondary text-sm">
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
    { id: "general" as const, icon: Settings, label: "General" },
    { id: "personas" as const, icon: UserIcon, label: "Personas" },
    { id: "account" as const, icon: Shield, label: "Account" },
    { id: "about" as const, icon: Zap, label: "About" },
  ];

  return (
    <nav className="w-48 flex-shrink-0">
      <ul className="space-y-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <li key={id}>
            <button
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? "bg-card-elevated text-foreground" : "text-foreground-muted hover:bg-card-elevated hover:text-foreground"
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
