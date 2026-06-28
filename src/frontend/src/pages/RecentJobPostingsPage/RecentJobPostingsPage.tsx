import { Box } from '@mui/material';
import { useGetAllJobsQuery } from '../../features/jobs/jobsApi';
import { useAppSelector } from '../../app/hooks';
import {
  selectRecentJobsMetadata,
  selectRecentJobsTimeBasedCounts,
} from '../../features/filters/selectors/recentJobsSelectors';
import { selectDemoModeEnabled } from '../../features/ui/uiSlice';
import { useAuth } from '../../features/auth/useAuth';
import { RecentJobsMetrics } from '../../components/recent-jobs-page/RecentJobsMetrics/RecentJobsMetrics';
import { RecentJobsFilters } from '../../components/recent-jobs-page/RecentJobsFilters';
import { RecentJobsList } from '../../components/recent-jobs-page/RecentJobsList/RecentJobsList';
import { ERROR_MESSAGES, SIGN_IN_OVERLAY_MESSAGES } from '../../constants/messages';
import { ErrorState } from '../../components/shared/ErrorDisplay';
import { SignInPrompt } from '../../components/shared/SignInPrompt/SignInPrompt';
import { extractErrorMessage } from '../../lib/errors';

export function RecentJobPostingsPage() {
  const { isAuthenticated, isEnabled, isLoading: authLoading } = useAuth();
  const shouldFetchJobs = !isEnabled || isAuthenticated;
  const { data, error } = useGetAllJobsQuery(undefined, {
    skip: !shouldFetchJobs || authLoading,
  });
  const metadata = useAppSelector(selectRecentJobsMetadata);
  const timeBasedCounts = useAppSelector(selectRecentJobsTimeBasedCounts);
  const demoModeEnabled = useAppSelector(selectDemoModeEnabled);

  const showSignIn = isEnabled && !authLoading && !isAuthenticated;

  return (
    <div className="mx-auto w-full max-w-[1340px] px-4 py-6 md:px-8 md:py-8 xl:px-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">
        Recent Job Postings
      </h1>

      {showSignIn ? (
        <Box sx={{ py: 8 }}>
          <SignInPrompt
            title="Sign in to view job postings."
            subtitle={SIGN_IN_OVERLAY_MESSAGES.SUBTITLE}
            buttonText={SIGN_IN_OVERLAY_MESSAGES.BUTTON_TEXT}
          />
        </Box>
      ) : null}

      {!showSignIn && error && !demoModeEnabled ? (
        <div className="mb-4">
          <ErrorState inline message={extractErrorMessage(error, ERROR_MESSAGES.LOAD_JOBS_FAILED)} />
        </div>
      ) : null}

      {!showSignIn && (demoModeEnabled || (!error && data)) && (
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
