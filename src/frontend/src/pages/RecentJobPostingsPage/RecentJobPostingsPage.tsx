import { useGetAllJobsQuery } from '../../features/jobs/jobsApi';
import { useAppSelector } from '../../app/hooks';
import {
  selectRecentJobsMetadata,
  selectRecentJobsTimeBasedCounts,
} from '../../features/filters/selectors/recentJobsSelectors';
import { selectDemoModeEnabled } from '../../features/ui/uiSlice';
import { RecentJobsMetrics } from '../../components/recent-jobs-page/RecentJobsMetrics/RecentJobsMetrics';
import { RecentJobsFilters } from '../../components/recent-jobs-page/RecentJobsFilters';
import { RecentJobsList } from '../../components/recent-jobs-page/RecentJobsList/RecentJobsList';
import { ERROR_MESSAGES } from '../../constants/messages';
import { ErrorState } from '../../components/shared/ErrorDisplay';
import { extractErrorMessage } from '../../lib/errors';

export function RecentJobPostingsPage() {
  const { data, error } = useGetAllJobsQuery();
  const metadata = useAppSelector(selectRecentJobsMetadata);
  const timeBasedCounts = useAppSelector(selectRecentJobsTimeBasedCounts);
  const demoModeEnabled = useAppSelector(selectDemoModeEnabled);

  return (
    <div className="mx-auto w-full max-w-[1340px] px-4 py-6 md:px-8 md:py-8 xl:px-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
        Recent Job Postings
      </h1>

      {error && !demoModeEnabled ? (
        <div className="mb-4">
          <ErrorState inline message={extractErrorMessage(error, ERROR_MESSAGES.LOAD_JOBS_FAILED)} />
        </div>
      ) : null}

      {(demoModeEnabled || (!error && data)) && (
        <>
          <RecentJobsMetrics
            totalJobs={metadata.filteredCount}
            jobsLast24Hours={timeBasedCounts.jobsLast24Hours}
            jobsLast3Hours={timeBasedCounts.jobsLast3Hours}
          />
          <RecentJobsFilters />
          <RecentJobsList />
        </>
      )}
    </div>
  );
}
