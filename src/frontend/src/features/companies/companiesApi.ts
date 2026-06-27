import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * One curated company in the public directory. Sourced from the backend
 * `companies` table via `GET /api/companies`, so a company added to the DB
 * appears here automatically. `blurb` / `accomplishment` are null until the
 * startup seeder fills them from `company_profiles.json`.
 */
export interface CuratedCompany {
  id: string;
  displayName: string;
  ats: string;
  blurb: string | null;
  accomplishment: string | null;
}

/**
 * Public, read-only API for the Curated Companies directory. No auth header —
 * the backend endpoint takes no token, so (unlike featuresApi) there is no
 * `prepareHeaders` / `getTokenOrNull` wiring.
 */
export const companiesApi = createApi({
  reducerPath: 'companiesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/companies' }),
  tagTypes: ['CuratedCompanies'],
  endpoints: (builder) => ({
    listCuratedCompanies: builder.query<CuratedCompany[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery('');

        const queryError = result.error;
        if (queryError !== undefined) {
          return { error: queryError };
        }

        if (
          'data' in result &&
          result.data &&
          typeof result.data === 'object' &&
          'companies' in result.data &&
          Array.isArray((result.data as { companies?: unknown }).companies)
        ) {
          return { data: (result.data as { companies: CuratedCompany[] }).companies };
        }

        return {
          error: {
            status: 'CUSTOM_ERROR',
            error: 'Invalid /api/companies response.',
          },
        };
      },
      providesTags: ['CuratedCompanies'],
    }),
  }),
});

export const { useListCuratedCompaniesQuery } = companiesApi;
