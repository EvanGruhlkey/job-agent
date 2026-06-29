import { ANALYTICS_CONFIG } from '../config/analytics';
import { POSTHOG_CONFIG } from '../config/posthog';
import { posthog } from './posthog';
import { getConsentStatus } from './analyticsConsent';

export type AnalyticsEventName =
  | 'job_apply_clicked'
  | 'recruiter_link_clicked'
  | 'recent_jobs_filter_changed'
  | 'recent_jobs_filters_reset'
  | 'recent_jobs_load_more';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __careerbaseGaLoaded?: boolean;
  }
}

function canCapture(): boolean {
  return ANALYTICS_CONFIG.isEnabled && getConsentStatus() === 'granted';
}

export function initGoogleAnalytics(): void {
  if (!ANALYTICS_CONFIG.isGoogleAnalyticsEnabled || window.__careerbaseGaLoaded) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    ANALYTICS_CONFIG.googleMeasurementId
  )}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS_CONFIG.googleMeasurementId, {
    anonymize_ip: true,
    send_page_view: false,
  });
  window.__careerbaseGaLoaded = true;
}

export function capturePageview(url = window.location.href): void {
  if (!canCapture()) return;

  if (POSTHOG_CONFIG.isEnabled) {
    posthog.capture('$pageview', { $current_url: url });
  }

  if (ANALYTICS_CONFIG.isGoogleAnalyticsEnabled) {
    initGoogleAnalytics();
    window.gtag?.('event', 'page_view', {
      page_location: url,
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    });
  }
}

export function captureAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): void {
  if (!canCapture()) return;

  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );

  if (POSTHOG_CONFIG.isEnabled) {
    posthog.capture(eventName, cleanProperties);
  }

  if (ANALYTICS_CONFIG.isGoogleAnalyticsEnabled) {
    initGoogleAnalytics();
    window.gtag?.('event', eventName, cleanProperties);
  }
}
