export const ROUTES = {
  RECENT_JOBS: '/',
  CURATED_COMPANIES: '/curated-companies',
} as const;

export const PRIMARY_NAV_ITEMS = [
  {
    path: ROUTES.RECENT_JOBS,
    label: 'Recent Job Postings',
    icon: 'Schedule',
  },
  {
    path: ROUTES.CURATED_COMPANIES,
    label: 'Curated Companies',
    icon: 'Business',
  },
] as const;

export const NAV_ITEMS = PRIMARY_NAV_ITEMS;
