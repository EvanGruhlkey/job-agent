import type { GitHubEvidenceProfile } from "@/lib/types";

import { loadStore, saveStore } from "./persist";

export async function getGitHubProfile(): Promise<GitHubEvidenceProfile | null> {
  const store = await loadStore();
  return store.githubProfile;
}

export async function upsertGitHubProfile(
  profile: GitHubEvidenceProfile,
): Promise<GitHubEvidenceProfile> {
  const store = await loadStore();
  store.githubProfile = profile;
  await saveStore(store);
  return profile;
}

export async function clearGitHubProfile(): Promise<void> {
  const store = await loadStore();
  store.githubProfile = null;
  await saveStore(store);
}
