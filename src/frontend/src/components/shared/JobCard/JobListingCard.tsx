import { type MouseEvent } from 'react';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Job } from '../../../types';
import { CompanyLogo } from '../CompanyLogo/CompanyLogo.tsx';
import { getCompanyById } from '../../../config/companies.ts';
import { useJobMetadata } from './useJobMetadata.ts';
import { captureAnalyticsEvent } from '../../../lib/analytics.ts';

interface JobListingCardProps {
  job: Job;
}

export function JobListingCard({ job }: JobListingCardProps) {
  const { postedAgo } = useJobMetadata(job.createdAt);
  const company = getCompanyById(job.company);
  const companyName = company?.name ?? job.company;
  const recruiterLinkedInUrl = company?.recruiterLinkedInUrl;

  const trackApplyClick = (surface: 'card' | 'button') => {
    captureAnalyticsEvent('job_apply_clicked', {
      surface,
      jobId: job.id,
      companyId: job.company,
      titleLength: job.title.length,
      isRemote: job.isRemote,
    });
  };

  const openJob = () => {
    trackApplyClick('card');
    window.open(job.url, '_blank', 'noopener,noreferrer');
  };
  const stop = (event: MouseEvent) => event.stopPropagation();

  const handleApplyButtonClick = (event: MouseEvent<HTMLAnchorElement>) => {
    stop(event);
    trackApplyClick('button');
  };

  const handleRecruiterLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    stop(event);
    captureAnalyticsEvent('recruiter_link_clicked', {
      companyId: job.company,
      jobId: job.id,
    });
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={openJob}
      onKeyDown={(event) => {
        if (event.key === 'Enter') openJob();
      }}
      className="mb-3 cursor-pointer py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:translate-y-0"
    >
      <CardContent className="p-5 md:p-6">
        <div className="flex gap-4 md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <CompanyLogo companyId={job.company} displayName={companyName} size={56} decorative />

            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground">{companyName}</div>
              <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-tight tracking-tight">
                {job.title}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {job.locations && job.locations.length > 0
                  ? job.locations.slice(0, 2).map((loc) => (
                      <Badge key={loc.canonicalName} variant="outline" className="h-7 gap-1 rounded-md">
                        <MapPin className="size-3" />
                        {loc.canonicalName}
                      </Badge>
                    ))
                  : job.location && (
                      <Badge variant="outline" className="h-7 gap-1 rounded-md">
                        <MapPin className="size-3" />
                        {job.location}
                      </Badge>
                    )}
                {job.isRemote && (
                  <Badge variant="outline" className="h-7 rounded-md">
                    Remote
                  </Badge>
                )}
              </div>

              {recruiterLinkedInUrl && (
                <a
                  href={recruiterLinkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleRecruiterLinkClick}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Find recruiter and hiring manager posts on LinkedIn
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              <div className="mt-2 text-sm text-muted-foreground">Posted {postedAgo}</div>
            </div>
          </div>

          <Button
            asChild
            className="group/apply mt-1 h-11 shrink-0 rounded-xl px-5 shadow-sm"
          >
            <a href={job.url} target="_blank" rel="noopener noreferrer" onClick={handleApplyButtonClick}>
              Apply
              <ArrowRight className="size-4 transition-transform group-hover/apply:translate-x-0.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
