import { Box, Container, Typography } from '@mui/material';
import { useListCuratedCompaniesQuery } from '../../features/companies/companiesApi';
import { useAuth } from '../../features/auth/useAuth';
import { LoadingState } from '../../components/shared/LoadingIndicator';
import { ErrorState } from '../../components/shared/ErrorDisplay';
import { SignInPrompt } from '../../components/shared/SignInPrompt/SignInPrompt';
import { extractErrorMessage, isUnauthorizedError } from '../../lib/errors';
import { SIGN_IN_OVERLAY_MESSAGES } from '../../constants/messages';
import { CuratedCompaniesGrid } from './CuratedCompaniesGrid';
import { RESPONSIVE } from '../../config/responsive';

/** Directory of tracked companies. Requires sign-in; data comes from `/api/companies`. */
export function CuratedCompaniesPage() {
  const { isAuthenticated, isEnabled, isLoading: authLoading } = useAuth();
  const { data, isLoading, isError, error, refetch } = useListCuratedCompaniesQuery(undefined, {
    skip: !isAuthenticated || authLoading,
  });

  const showSignIn =
    isEnabled &&
    !authLoading &&
    (!isAuthenticated || (isError && error != null && isUnauthorizedError(error)));

  return (
    <Container maxWidth="xl" sx={{ py: RESPONSIVE.spacing.pageMarginY }}>
      <Box sx={{ mb: RESPONSIVE.spacing.sectionMarginB }}>
        <Typography variant="h4" component="h1">
          Companies
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Every company this site tracks, hand-picked into one place. Search to see what each company
          does and one thing it’s known for.
        </Typography>
      </Box>

      {showSignIn ? (
        <Box sx={{ py: 8 }}>
          <SignInPrompt
            title="Sign in to browse companies."
            subtitle={SIGN_IN_OVERLAY_MESSAGES.SUBTITLE}
            buttonText={SIGN_IN_OVERLAY_MESSAGES.BUTTON_TEXT}
          />
        </Box>
      ) : null}

      {!showSignIn && isLoading && (
        <LoadingState size={60} minHeight={400} caption="Loading companies…" />
      )}

      {!showSignIn && isError && !isUnauthorizedError(error) && (
        <ErrorState
          inline
          message={extractErrorMessage(error, 'Failed to load companies.')}
          onRetry={refetch}
        />
      )}

      {!showSignIn && !isLoading && !isError && data && (
        <CuratedCompaniesGrid companies={data} />
      )}
    </Container>
  );
}
