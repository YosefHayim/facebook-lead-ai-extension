import { useState } from 'react';
import { Sparkles, Key, User, Rocket, ChevronRight, ChevronLeft, Check, Target, MessageSquare, TrendingUp } from 'lucide-react';
import { personasStorage, activePersonaIdStorage, onboardingCompleteStorage } from '../../../src/lib/storage';
import type { Persona, AITone } from '../../../src/types';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'api-key' | 'persona' | 'ready';

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [persona, setPersona] = useState({
    name: '',
    role: '',
    keywords: '',
    valueProposition: '',
    aiTone: 'professional' as AITone,
  });

  const steps: Step[] = ['welcome', 'api-key', 'persona', 'ready'];
  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    await browser.runtime.sendMessage({ type: 'SET_API_KEY', provider: aiProvider, apiKey });
    handleNext();
  };

  const handleSavePersona = async () => {
    if (!persona.name.trim() || !persona.role.trim()) return;
    
    const newPersona: Persona = {
      id: `persona_${Date.now()}`,
      name: persona.name,
      role: persona.role,
      keywords: persona.keywords.split(',').map(k => k.trim()).filter(Boolean),
      negativeKeywords: [],
      aiTone: persona.aiTone,
      valueProposition: persona.valueProposition,
      isActive: true,
      createdAt: Date.now(),
    };

    const personas = await personasStorage.getValue();
    await personasStorage.setValue([newPersona, ...personas]);
    await activePersonaIdStorage.setValue(newPersona.id);
    handleNext();
  };

  const handleFinish = async () => {
    await onboardingCompleteStorage.setValue(true);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <ProgressBar currentIndex={currentIndex} totalSteps={steps.length} />
      
      <div className="flex-1 flex flex-col p-6">
        {currentStep === 'welcome' && <WelcomeStep onNext={handleNext} />}
        {currentStep === 'api-key' && (
          <ApiKeyStep
            apiKey={apiKey}
            setApiKey={setApiKey}
            aiProvider={aiProvider}
            setAiProvider={setAiProvider}
            onNext={handleSaveApiKey}
            onBack={handleBack}
          />
        )}
        {currentStep === 'persona' && (
          <PersonaStep
            persona={persona}
            setPersona={setPersona}
            onNext={handleSavePersona}
            onBack={handleBack}
          />
        )}
        {currentStep === 'ready' && <ReadyStep onFinish={handleFinish} onBack={handleBack} />}
      </div>
    </div>
  );
}

function ProgressBar({ currentIndex, totalSteps }: { currentIndex: number; totalSteps: number }) {
  return (
    <div className="px-6 pt-4">
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LeadScout AI</h1>
        <p className="text-gray-600 mb-8 max-w-xs">
          Find potential clients in Facebook groups using AI-powered lead detection.
        </p>

        <div className="space-y-4 w-full max-w-xs text-left">
          <FeatureItem
            icon={<Target className="w-5 h-5 text-blue-500" />}
            title="Smart Lead Detection"
            description="AI identifies people looking for your services"
          />
          <FeatureItem
            icon={<MessageSquare className="w-5 h-5 text-green-500" />}
            title="Draft Responses"
            description="Get AI-generated replies tailored to each post"
          />
          <FeatureItem
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            title="Track Results"
            description="Monitor your outreach and conversion rates"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Get Started
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

interface ApiKeyStepProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  aiProvider: 'gemini' | 'openai';
  setAiProvider: (provider: 'gemini' | 'openai') => void;
  onNext: () => void;
  onBack: () => void;
}

function ApiKeyStep({ apiKey, setApiKey, aiProvider, setAiProvider, onNext, onBack }: ApiKeyStepProps) {
  const isValid = apiKey.trim().length > 10;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Connect AI Provider</h2>
            <p className="text-sm text-gray-500">Required for lead analysis</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <ProviderButton
                selected={aiProvider === 'gemini'}
                onClick={() => setAiProvider('gemini')}
                title="Google Gemini"
                subtitle="Free tier available"
              />
              <ProviderButton
                selected={aiProvider === 'openai'}
                onClick={() => setAiProvider('openai')}
                title="OpenAI"
                subtitle="GPT-4o-mini"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={aiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {aiProvider === 'gemini' ? (
                <>Get your free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a></>
              ) : (
                <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Platform</a></>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ProviderButton({ selected, onClick, title, subtitle }: { selected: boolean; onClick: () => void; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 text-left transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs ${selected ? 'text-blue-600' : 'text-gray-500'}`}>{subtitle}</p>
    </button>
  );
}

interface PersonaStepProps {
  persona: { name: string; role: string; keywords: string; valueProposition: string; aiTone: AITone };
  setPersona: (p: { name: string; role: string; keywords: string; valueProposition: string; aiTone: AITone }) => void;
  onNext: () => void;
  onBack: () => void;
}

function PersonaStep({ persona, setPersona, onNext, onBack }: PersonaStepProps) {
  const isValid = persona.name.trim() && persona.role.trim() && persona.keywords.trim();

  const presets = [
    { name: 'Web Developer', role: 'Freelance Web Developer', keywords: 'need website, looking for developer, who can build, web developer needed' },
    { name: 'Designer', role: 'Graphic Designer', keywords: 'need logo, looking for designer, brand design, graphic designer' },
    { name: 'Marketing', role: 'Digital Marketing Consultant', keywords: 'need marketing, looking for ads, social media help, seo help' },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setPersona({ ...persona, name: preset.name, role: preset.role, keywords: preset.keywords });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Your Persona</h2>
            <p className="text-sm text-gray-500">Tell us what leads you're looking for</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">QUICK START</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Persona Name</label>
            <input
              type="text"
              value={persona.name}
              onChange={(e) => setPersona({ ...persona, name: e.target.value })}
              placeholder="e.g., Web Developer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Role</label>
            <input
              type="text"
              value={persona.role}
              onChange={(e) => setPersona({ ...persona, role: e.target.value })}
              placeholder="e.g., Freelance Full-Stack Developer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords to Match</label>
            <textarea
              value={persona.keywords}
              onChange={(e) => setPersona({ ...persona, keywords: e.target.value })}
              placeholder="need website, looking for developer, who can build (comma separated)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Posts containing these keywords will be analyzed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Value Proposition</label>
            <textarea
              value={persona.valueProposition}
              onChange={(e) => setPersona({ ...persona, valueProposition: e.target.value })}
              placeholder="I build fast, responsive websites that help businesses grow..."
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Response Tone</label>
            <select
              value={persona.aiTone}
              onChange={(e) => setPersona({ ...persona, aiTone: e.target.value as AITone })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ReadyStep({ onFinish, onBack }: { onFinish: () => void; onBack: () => void }) {
  const steps = [
    { num: 1, text: 'Go to a Facebook group with your target audience' },
    { num: 2, text: 'Click "Scan This Page" to analyze posts' },
    { num: 3, text: 'Review detected leads and their AI scores' },
    { num: 4, text: 'Copy the draft response or customize it' },
    { num: 5, text: 'Navigate to the post and reply!' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Rocket className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600 mb-8">Here's how to find your first leads:</p>

        <div className="w-full max-w-xs space-y-3 text-left">
          {steps.map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">{step.num}</span>
              </div>
              <p className="text-sm text-gray-700">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onFinish}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          <Check className="w-5 h-5" />
          Start Finding Leads
        </button>
      </div>
    </div>
  );
}
