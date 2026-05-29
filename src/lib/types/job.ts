export type JobPosting = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  description: string;
  requirements: string[];
  niceToHaves: string[];
  applicationUrl: string | null;
  sourceUrl: string | null;
};
