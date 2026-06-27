import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCompanyLogoUrl } from '../../../config/companies.ts';

interface CompanyLogoProps {
  companyId: string;
  displayName?: string;
  size?: number;
  decorative?: boolean;
}

export function CompanyLogo({
  companyId,
  displayName,
  size = 28,
  decorative = false,
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const [trackedId, setTrackedId] = useState(companyId);

  if (companyId !== trackedId) {
    setTrackedId(companyId);
    setFailed(false);
  }

  const label = displayName ?? companyId;
  const initial = label.trim().charAt(0).toUpperCase();
  const style = { width: size, height: size };

  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-card text-muted-foreground',
        failed && 'font-semibold'
      )}
      style={style}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      {failed ? (
        <span style={{ fontSize: size * 0.45 }}>{initial}</span>
      ) : (
        <img
          src={getCompanyLogoUrl(companyId)}
          alt={decorative ? '' : label}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}
