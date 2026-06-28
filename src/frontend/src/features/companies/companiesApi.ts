import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * One curated company in the directory. Sourced from the backend `companies`
 * table via `GET /api/companies`. Requires a signed-in user.
 */
export interface CuratedCompany {
  id: string;
  displayName: string;
  ats: string;
  blurb: string | null;
  accomplishment: string | null;
}

interface CompaniesApiExtra {
  getTokenOrNull: () => Promise<string | null>;
}

export const companiesApi = createApi({
  reducerPath: 'companiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/companies',
    prepareHeaders: async (headers, { extra }) => {
      const { getTokenOrNull } = extra as CompaniesApiExtra;
      const token = await getTokenOrNull();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
