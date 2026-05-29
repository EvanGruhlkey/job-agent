/** Raw GitHub profile snapshot before conversion to EvidenceItem records. */
export type GitHubRepoSnapshot = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  readmeExcerpt: string | null;
};

export type GitHubEvidenceProfile = {
  username: string;
  fetchedAt: string | null;
  repos: GitHubRepoSnapshot[];
};
