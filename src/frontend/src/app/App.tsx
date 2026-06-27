import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout.tsx';
import { CuratedCompaniesPage } from '../pages/CuratedCompaniesPage';
import { RecentJobPostingsPage } from '../pages/RecentJobPostingsPage/RecentJobPostingsPage';
import { ROUTES } from '../config/routes';
import { usePostHogPageview } from '../features/analytics/usePostHogPageview';
import { useEnabledCompanies } from '../features/preferences/useEnabledCompanies';
import { useFeaturesAuthBridge } from '../features/features/useFeaturesAuthBridge';
import { useHydrateSavedFilters } from '../features/savedFilters/useHydrateSavedFilters';

function AppContent() {
  useEnabledCompanies();
  useFeaturesAuthBridge();
  useHydrateSavedFilters();
  usePostHogPageview();

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<RecentJobPostingsPage />} />
        <Route path={ROUTES.CURATED_COMPANIES} element={<CuratedCompaniesPage />} />
        <Route path="*" element={<Navigate to={ROUTES.RECENT_JOBS} replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
