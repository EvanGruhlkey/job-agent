import { useMemo, useState } from 'react';
import { ChevronDown, CircleCheck, CircleX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAllJobsProgress } from '../../../features/jobs/hooks/useAllJobsProgress';
import { getCompanyById } from '../../../config/companies';

interface FetchProgressBarProps {
  companyIdFilter?: Set<string> | null;
}

export function FetchProgressBar({ companyIdFilter }: FetchProgressBarProps = {}) {
  const { progress, isLoading } = useAllJobsProgress();
  const [expanded, setExpanded] = useState(false);

  const visibleCompanies = useMemo(() => {
    const filtered =
      !companyIdFilter || companyIdFilter.size === 0
        ? progress.companies
        : progress.companies.filter((c) => companyIdFilter.has(c.companyId));
    return [...filtered].sort((a, b) => {
      const nameA = getCompanyById(a.companyId)?.name ?? a.companyId;
      const nameB = getCompanyById(b.companyId)?.name ?? b.companyId;
      return nameA.localeCompare(nameB);
    });
  }, [progress.companies, companyIdFilter]);

  const visibleTotal = visibleCompanies.length;
  const visibleCompleted = visibleCompanies.filter(
    (c) => c.status === 'success' || c.status === 'error'
  ).length;
  const percentComplete = visibleTotal > 0 ? (visibleCompleted / visibleTotal) * 100 : 0;
  const successCount = visibleCompanies.filter((c) => c.status === 'success').length;
  const errorCount = visibleCompanies.filter((c) => c.status === 'error').length;
  const totalJobs = visibleCompanies
    .filter((c) => c.status === 'success')
    .reduce((sum, c) => sum + (c.jobCount ?? 0), 0);

  if (progress.total === 0 || visibleTotal === 0) return null;

  return (
    <Card className="mb-4 gap-0 overflow-hidden py-0">
      <Button
        type="button"
        variant="ghost"
        className="h-auto justify-between rounded-none px-5 py-4 hover:bg-muted/60"
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-left">
          {isLoading ? (
            <>
              <div className="min-w-52 flex-1">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm font-medium">
                  <span>
                    Loading jobs from {visibleCompleted}/{visibleTotal} companies
                  </span>
                  <span className="text-muted-foreground">{percentComplete.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <CircleCheck className="size-4 text-emerald-600" />
              <span className="text-sm font-semibold">
                Loaded {visibleCompleted}/{visibleTotal} companies
              </span>
              {successCount > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {successCount} loaded ({totalJobs} jobs)
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} failed
                </Badge>
              )}
            </>
          )}
        </div>
        <ChevronDown
          className={cn('ml-3 size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </Button>

      {expanded && (
        <div className="border-t px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {visibleCompanies.map((company) => {
              const displayName = getCompanyById(company.companyId)?.name ?? company.companyId;
              if (company.status === 'success') {
                return (
                  <Badge key={company.companyId} variant="outline" className="gap-1.5">
                    <CircleCheck className="size-3 text-emerald-600" />
                    {displayName}
                    {company.jobCount !== undefined ? ` (${company.jobCount})` : ''}
                  </Badge>
                );
              }
              if (company.status === 'error') {
                return (
                  <Badge key={company.companyId} variant="destructive" title={company.error || 'Failed to load'}>
                    <CircleX className="size-3" />
                    {displayName}
                  </Badge>
                );
              }
              return (
                <Badge key={company.companyId} variant="outline">
                  {displayName}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
