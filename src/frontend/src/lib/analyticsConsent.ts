import { POSTHOG_CONFIG } from '../config/posthog';
import { posthog } from './posthog';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

const CONSENT_KEY = 'careerbase_analytics_consent';

export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  const stored = window.localStorage.getItem(CONSENT_KEY);
  if (stored === 'granted' || stored === 'denied') return stored;
  return 'pending';
}

export function acceptTracking(): void {
  window.localStorage.setItem(CONSENT_KEY, 'granted');

  if (POSTHOG_CONFIG.isEnabled) {
    posthog.set_config({ persistence: 'localStorage+cookie' });
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
  }
}

export function declineTracking(): void {
  window.localStorage.setItem(CONSENT_KEY, 'denied');

  if (POSTHOG_CONFIG.isEnabled) {
    posthog.opt_out_capturing();
  }
}
