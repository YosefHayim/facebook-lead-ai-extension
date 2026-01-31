import * as Sentry from '@sentry/browser';
import posthog from 'posthog-js';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let isInitialized = false;

export function initAnalytics() {
  if (isInitialized) return;

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        if (import.meta.env.DEV) {
          console.log('[Sentry] Event captured:', event);
        }
        return event;
      },
    });
  }

  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: 'localStorage',
      loaded: (ph) => {
        if (import.meta.env.DEV) {
          console.log('[PostHog] Initialized');
          ph.opt_out_capturing();
        }
      },
    });
  }

  isInitialized = true;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.setUser({ id: userId, ...traits });
  }

  if (POSTHOG_KEY) {
    posthog.identify(userId, traits);
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }

  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, properties);
  }
}

export function trackError(error: Error, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }

  console.error('[Error]', error, context);
}

export function setUserProperty(key: string, value: unknown) {
  if (POSTHOG_KEY) {
    posthog.people.set({ [key]: value });
  }
}

export function resetAnalytics() {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }

  if (POSTHOG_KEY) {
    posthog.reset();
  }
}

export const AnalyticsEvents = {
  EXTENSION_OPENED: 'extension_opened',
  SCAN_STARTED: 'scan_started',
  SCAN_COMPLETED: 'scan_completed',
  LEAD_FOUND: 'lead_found',
  LEAD_STATUS_CHANGED: 'lead_status_changed',
  AI_REPLY_GENERATED: 'ai_reply_generated',
  REPLY_COPIED: 'reply_copied',
  GROUP_ADDED: 'group_added',
  PERSONA_CREATED: 'persona_created',
  AUTOMATION_STARTED: 'automation_started',
  AUTOMATION_STOPPED: 'automation_stopped',
  UPGRADE_CLICKED: 'upgrade_clicked',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SETTINGS_CHANGED: 'settings_changed',
  LCI_FETCHED: 'lci_fetched',
  BULK_ACTION_PERFORMED: 'bulk_action_performed',
} as const;
