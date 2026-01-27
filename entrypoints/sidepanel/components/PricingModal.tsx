import { useState } from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';
import { createCheckout, type SubscriptionPlan } from '../../../src/lib/api';
import { trackEvent, AnalyticsEvents } from '../../../src/lib/analytics';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: SubscriptionPlan;
}

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      '10 leads/month',
      '25 AI calls/month',
      'Manual scanning',
      'Basic lead analysis',
    ],
    limitations: [
      'No automation',
      'No priority support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19,
    period: 'month',
    features: [
      '500 leads/month',
      '1,000 AI calls/month',
      'Automation (AI Spy Mode)',
      'Advanced lead analysis',
      'Bulk actions',
      'LCI profile insights',
      'Priority support',
    ],
    limitations: [],
  },
  agency: {
    name: 'Agency',
    price: 49,
    period: 'month',
    features: [
      'Unlimited leads',
      '5,000 AI calls/month',
      'Everything in Pro',
      'Multi-persona support',
      'Team collaboration',
      'API access',
      'Dedicated support',
    ],
    limitations: [],
  },
};

export function PricingModal({ isOpen, onClose, currentPlan = 'free' }: PricingModalProps) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === 'free' || plan === currentPlan) return;

    setLoading(plan);
    setError(null);

    trackEvent(AnalyticsEvents.CHECKOUT_STARTED, { plan });

    const result = await createCheckout(plan);

    if (result.success && result.data?.checkoutUrl) {
      window.open(result.data.checkoutUrl, '_blank');
      onClose();
    } else {
      setError(result.error || 'Failed to start checkout');
    }

    setLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-background border border-border rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card rounded-lg transition-colors text-foreground-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 grid md:grid-cols-3 gap-4">
          {(Object.entries(PLANS) as [SubscriptionPlan, typeof PLANS.free][]).map(([planKey, plan]) => {
            const isCurrentPlan = planKey === currentPlan;
            const isPopular = planKey === 'pro';

            return (
              <div
                key={planKey}
                className={`relative rounded-xl border p-4 ${
                  isPopular
                    ? 'border-accent bg-card-elevated'
                    : 'border-border bg-card'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-background text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {planKey === 'agency' && <Crown className="w-5 h-5 text-amber-400" />}
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-foreground-secondary text-sm">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-foreground-muted flex-shrink-0 mt-0.5" />
                      <span className="text-foreground-muted">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={isCurrentPlan || loading !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-card-elevated text-foreground-muted cursor-not-allowed'
                      : isPopular
                      ? 'bg-accent text-background hover:bg-accent-hover'
                      : 'bg-card-elevated text-foreground hover:bg-border'
                  } ${loading === planKey ? 'opacity-50' : ''}`}
                >
                  {loading === planKey
                    ? 'Loading...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : planKey === 'free'
                    ? 'Get Started'
                    : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-4 text-center text-sm text-foreground-muted">
          Secure payments powered by Lemon Squeezy. Cancel anytime.
        </div>
      </div>
    </div>
  );
}
