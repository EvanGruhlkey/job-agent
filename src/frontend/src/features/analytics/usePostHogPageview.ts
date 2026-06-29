import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { capturePageview } from '../../lib/analytics';

export function usePostHogPageview(): void {
  const location = useLocation();

  useEffect(() => {
    capturePageview();
  }, [location.pathname, location.search]);
}
