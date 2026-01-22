import { Sparkles, Check } from 'lucide-react';

export function AboutTab() {
  return (
    <div className="space-y-6">
      <AboutHeader />
      <FeaturesSection />
      <SupportSection />
    </div>
  );
}

function AboutHeader() {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">LeadScout AI</h2>
          <p className="text-gray-500">Version 1.0.0</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">
        LeadScout AI is an intelligent browser extension that helps you discover and connect with potential
        leads on Facebook. Using advanced AI, it automatically identifies buying intent and generates
        personalized responses.
      </p>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    'AI-powered intent classification',
    'Automatic reply generation',
    'Multi-persona support',
    'Cloud sync with Supabase',
    'Human-like behavior patterns',
  ];

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Features</h3>
      <ul className="space-y-3 text-sm text-gray-600">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SupportSection() {
  const links = [
    { label: 'Documentation', href: '#' },
    { label: 'Report a Bug', href: '#' },
    { label: 'Request a Feature', href: '#' },
  ];

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Support</h3>
      <div className="space-y-2 text-sm">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="block text-blue-600 hover:underline">
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
