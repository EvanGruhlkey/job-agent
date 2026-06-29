import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ANALYTICS_CONFIG } from '../../config/analytics';
import { capturePageview } from '../../lib/analytics';
import {
  acceptTracking,
  declineTracking,
  getConsentStatus,
  type ConsentStatus,
} from '../../lib/analyticsConsent';

export function CookieConsentBanner() {
  const [status, setStatus] = useState<ConsentStatus>(getConsentStatus);

  if (!ANALYTICS_CONFIG.isEnabled || status !== 'pending') return null;

  const handleAccept = () => {
    acceptTracking();
    capturePageview();
    setStatus('granted');
  };

  const handleDecline = () => {
    declineTracking();
    setStatus('denied');
  };

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[1400] flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end">
      <Card
        size="sm"
        className="pointer-events-auto w-full max-w-[310px] rounded-lg border-border/80 bg-card/95 py-0 text-card-foreground shadow-md shadow-black/10 backdrop-blur"
      >
        <CardContent className="p-3">
          <div className="text-xs font-semibold leading-4">Analytics</div>
          <p className="mt-0.5 text-xs leading-4 text-muted-foreground">
            Help improve job search. No selling data.
          </p>
          <div className="mt-2 flex gap-1.5">
            <Button type="button" size="xs" className="h-7 px-2.5" onClick={handleAccept}>
              Accept
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="h-7 px-2.5"
              onClick={handleDecline}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
