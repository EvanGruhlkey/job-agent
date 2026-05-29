import type { JobPosting } from "@/lib/types";

import { createId } from "./id";
import { loadStore, saveStore } from "./persist";

export async function listJobPostings(): Promise<JobPosting[]> {
  const store = await loadStore();
  return store.jobPostings;
}

export async function getJobPosting(id: string): Promise<JobPosting | null> {
  const store = await loadStore();
  return store.jobPostings.find((j) => j.id === id) ?? null;
}

export async function createJobPosting(
  input: Omit<JobPosting, "id">,
): Promise<JobPosting> {
  const store = await loadStore();
  const posting: JobPosting = { id: createId(), ...input };
  store.jobPostings.push(posting);
  await saveStore(store);
  return posting;
}

export async function updateJobPosting(
  id: string,
  patch: Partial<Omit<JobPosting, "id">>,
): Promise<JobPosting | null> {
  const store = await loadStore();
  const index = store.jobPostings.findIndex((j) => j.id === id);
  if (index === -1) return null;

  const updated: JobPosting = { ...store.jobPostings[index], ...patch };
  store.jobPostings[index] = updated;
  await saveStore(store);
  return updated;
}

export async function deleteJobPosting(id: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.jobPostings.length;
  store.jobPostings = store.jobPostings.filter((j) => j.id !== id);
  if (store.jobPostings.length === before) return false;
  await saveStore(store);
  return true;
}
