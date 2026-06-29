import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout.tsx';
import { CuratedCompaniesPage } from '../pages/CuratedCompaniesPage';
import { RecentJobPostingsPage } from '../pages/RecentJobPostingsPage/RecentJobPostingsPage';
import { ROUTES } from '../config/routes';
import { usePostHogPageview } from '../features/analytics/usePostHogPageview';

function AppContent() {
  usePostHogPageview();

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<RecentJobPostingsPage />} />
        <Route path={ROUTES.COMPANIES} element={<CuratedCompaniesPage />} />
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
