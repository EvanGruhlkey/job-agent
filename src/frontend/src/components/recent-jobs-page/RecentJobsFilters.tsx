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
      if (company) dispatch(addRecentJobsCompany(company.id));
    },
    [availableCompanies, dispatch]
  );

  const handleRemoveCompany = useCallback(
    (name: string) => {
      const company = availableCompanies.find((c) => c.name === name);
      if (company) dispatch(removeRecentJobsCompany(company.id));
    },
    [availableCompanies, dispatch]
  );

  return (
    <div className="mb-5 space-y-4">
      <SearchTagsInput
        value={filters.searchTags || []}
        onAdd={(tag) => dispatch(addRecentJobsSearchTag(tag))}
        onRemove={(text) => dispatch(removeRecentJobsSearchTag(text))}
        onToggleMode={(text) => dispatch(toggleRecentJobsSearchTagMode(text))}
        placeholder="Search by title, keyword, company, or location..."
        showSearchIcon
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(140px,170px)_minmax(170px,1fr)_minmax(170px,1fr)_150px] lg:items-end">
        <TimeWindowSelect
          value={filters.timeWindow}
          onChange={(tw) => dispatch(setRecentJobsTimeWindow(tw))}
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
          onAdd={(loc) => dispatch(addRecentJobsLocation(loc))}
          onRemove={(loc) => dispatch(removeRecentJobsLocation(loc))}
          placeholder="Location"
        />

        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-card"
          onClick={() => dispatch(resetRecentJobsFilters())}
        >
          <RotateCcw className="size-4" />
          Reset filters
        </Button>
      </div>
    </div>
  );
}
