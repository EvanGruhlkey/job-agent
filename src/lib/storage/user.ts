import type { UserProfile } from "@/lib/types";

import { loadStore, saveStore } from "./persist";

export async function getUserProfile(): Promise<UserProfile | null> {
  const store = await loadStore();
  return store.userProfile;
}

export async function upsertUserProfile(
  profile: UserProfile,
): Promise<UserProfile> {
  const store = await loadStore();
  store.userProfile = profile;
  await saveStore(store);
  return profile;
}
