import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../features/app/appSlice';
import { companiesApi } from '../features/companies/companiesApi';
import graphFiltersReducer from '../features/filters/slices/graphFiltersSlice';
import recentJobsFiltersReducer from '../features/filters/slices/recentJobsFiltersSlice';
import { jobsApi } from '../features/jobs/jobsApi';
import enabledCompaniesReducer from '../features/preferences/enabledCompaniesSlice';
import { savedFiltersApi } from '../features/savedFilters/savedFiltersApi';
import uiReducer from '../features/ui/uiSlice';
import { getTokenOrNull } from '../features/features/getTokenOrNull';

export const store = configureStore({
  reducer: {
    app: appReducer,
    graphFilters: graphFiltersReducer,
    recentJobsFilters: recentJobsFiltersReducer,
    ui: uiReducer,
    enabledCompanies: enabledCompaniesReducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [savedFiltersApi.reducerPath]: savedFiltersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: { extraArgument: { getTokenOrNull } },
    }).concat(companiesApi.middleware, jobsApi.middleware, savedFiltersApi.middleware),
});

/**
 * Root Redux state type
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type
 */
export type AppDispatch = typeof store.dispatch;
