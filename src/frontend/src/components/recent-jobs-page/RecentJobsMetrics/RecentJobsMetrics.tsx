import { Card } from '@/components/ui/card';

interface RecentJobsMetricsProps {
  totalJobs: number;
  jobsLast24Hours: number;
  jobsLast3Hours: number;
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-h-28 flex-1 flex-col items-center justify-center px-4 py-6 text-center">
      <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function RecentJobsMetrics({
  totalJobs,
  jobsLast24Hours,
  jobsLast3Hours,
}: RecentJobsMetricsProps) {
  return (
    <Card className="mb-6 gap-0 py-0">
      <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Metric value={totalJobs} label="Displayed Jobs" />
        <Metric value={jobsLast24Hours} label="Past 24 Hours" />
        <Metric value={jobsLast3Hours} label="Past 3 Hours" />
      </div>
    </Card>
  );
}
