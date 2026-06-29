import { POSTHOG_CONFIG } from './posthog';

export interface AnalyticsConfig {
  googleMeasurementId: string;
  isGoogleAnalyticsEnabled: boolean;
  isEnabled: boolean;
}

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  googleMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID ?? '',
  get isGoogleAnalyticsEnabled() {
    return Boolean(this.googleMeasurementId);
  },
  get isEnabled() {
    return this.isGoogleAnalyticsEnabled || POSTHOG_CONFIG.isEnabled;
  },
};
