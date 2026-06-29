import { useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '../../app/hooks.ts';
import {
  addRecentJobsCompany,
  addRecentJobsLocation,
  addRecentJobsSearchTag,
  removeRecentJobsCompany,
  removeRecentJobsLocation,
  removeRecentJobsSearchTag,
  resetRecentJobsFilters,
  setRecentJobsTimeWindow,
  toggleRecentJobsSearchTagMode,
} from '../../features/filters/slices/recentJobsFiltersSlice.ts';
import {
  selectRecentAvailableCompanies,
  selectRecentAvailableLocations,
  selectRecentJobsFilters,
} from '../../features/filters/selectors/recentJobsSelectors.ts';
import { MultiSelectAutocomplete } from '../shared/filters/MultiSelectAutocomplete.tsx';
import { SearchTagsInput } from '../shared/filters/SearchTagsInput.tsx';
import { TimeWindowSelect } from '../shared/filters/TimeWindowSelect.tsx';
import { captureAnalyticsEvent } from '../../lib/analytics.ts';
import type { SearchTag } from '../../types';

export function RecentJobsFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectRecentJobsFilters);
  const availableLocations = useAppSelector(selectRecentAvailableLocations);
  const availableCompanies = useAppSelector(selectRecentAvailableCompanies);

  const companyOptions = useMemo(() => availableCompanies.map((c) => c.name), [availableCompanies]);
  const selectedCompanyNames = useMemo(
    () =>
      (filters.company || []).map((id) => {
        const company = availableCompanies.find((c) => c.id === id);
        return company?.name || id;
      }),
    [filters.company, availableCompanies]
  );

  const handleAddCompany = useCallback(
    (name: string) => {
      const company = availableCompanies.find((c) => c.name === name);
      if (company) {
        dispatch(addRecentJobsCompany(company.id));
        captureAnalyticsEvent('recent_jobs_filter_changed', {
          filter: 'company',
          action: 'add',
          companyId: company.id,
        });
      }
    },
    [availableCompanies, dispatch]
  );

  const handleRemoveCompany = useCallback(
    (name: string) => {
      const company = availableCompanies.find((c) => c.name === name);
      if (company) {
        dispatch(removeRecentJobsCompany(company.id));
        captureAnalyticsEvent('recent_jobs_filter_changed', {
          filter: 'company',
          action: 'remove',
          companyId: company.id,
        });
      }
    },
    [availableCompanies, dispatch]
  );

  const handleAddSearchTag = useCallback(
    (tag: SearchTag) => {
      dispatch(addRecentJobsSearchTag(tag));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'search',
        action: 'add',
        mode: tag.mode,
        tagLength: tag.text.length,
      });
    },
    [dispatch]
  );

  const handleRemoveSearchTag = useCallback(
    (text: string) => {
      dispatch(removeRecentJobsSearchTag(text));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'search',
        action: 'remove',
      });
    },
    [dispatch]
  );

  const handleToggleSearchTagMode = useCallback(
    (text: string) => {
      dispatch(toggleRecentJobsSearchTagMode(text));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'search',
        action: 'toggle_mode',
      });
    },
    [dispatch]
  );

  const handleTimeWindowChange = useCallback(
    (timeWindow: typeof filters.timeWindow) => {
      dispatch(setRecentJobsTimeWindow(timeWindow));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'time_window',
        value: timeWindow,
      });
    },
    [dispatch]
  );

  const handleAddLocation = useCallback(
    (location: string) => {
      dispatch(addRecentJobsLocation(location));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'location',
        action: 'add',
      });
    },
    [dispatch]
  );

  const handleRemoveLocation = useCallback(
    (location: string) => {
      dispatch(removeRecentJobsLocation(location));
      captureAnalyticsEvent('recent_jobs_filter_changed', {
        filter: 'location',
        action: 'remove',
      });
    },
    [dispatch]
  );

  const handleResetFilters = useCallback(() => {
    dispatch(resetRecentJobsFilters());
    captureAnalyticsEvent('recent_jobs_filters_reset');
  }, [dispatch]);

  return (
    <div className="mb-5 space-y-4">
      <SearchTagsInput
        value={filters.searchTags || []}
        onAdd={handleAddSearchTag}
        onRemove={handleRemoveSearchTag}
        onToggleMode={handleToggleSearchTagMode}
        placeholder="Search by title, keyword, company, or location..."
        showSearchIcon
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(140px,170px)_minmax(170px,1fr)_minmax(170px,1fr)_150px] lg:items-end">
        <TimeWindowSelect
          value={filters.timeWindow}
          onChange={handleTimeWindowChange}
          label="Time Window"
        />

        <MultiSelectAutocomplete
          label="Company"
          options={companyOptions}
          value={selectedCompanyNames}
          onAdd={handleAddCompany}
          onRemove={handleRemoveCompany}
          placeholder="Company"
        />

        <MultiSelectAutocomplete
          label="Location"
          options={availableLocations}
          value={filters.location || []}
          onAdd={handleAddLocation}
          onRemove={handleRemoveLocation}
          placeholder="Location"
        />

        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-card"
          onClick={handleResetFilters}
        >
          <RotateCcw className="size-4" />
          Reset filters
        </Button>
      </div>
    </div>
  );
}
