import type { MasterResume } from "@/lib/types";

import { createId, nowIso } from "./id";
import { loadStore, saveStore } from "./persist";

export async function listMasterResumes(): Promise<MasterResume[]> {
  const store = await loadStore();
  return store.masterResumes;
}

export async function getMasterResume(
  id: string,
): Promise<MasterResume | null> {
  const store = await loadStore();
  return store.masterResumes.find((r) => r.id === id) ?? null;
}

export async function createMasterResume(
  input: Pick<MasterResume, "userId" | "title" | "latexSource">,
): Promise<MasterResume> {
  const store = await loadStore();
  const timestamp = nowIso();
  const resume: MasterResume = {
    id: createId(),
    userId: input.userId,
    title: input.title,
    latexSource: input.latexSource,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.masterResumes.push(resume);
  await saveStore(store);
  return resume;
}

export async function updateMasterResume(
  id: string,
  patch: Partial<Pick<MasterResume, "title" | "latexSource">>,
): Promise<MasterResume | null> {
  const store = await loadStore();
  const index = store.masterResumes.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updated: MasterResume = {
    ...store.masterResumes[index],
    ...patch,
    updatedAt: nowIso(),
  };
  store.masterResumes[index] = updated;
  await saveStore(store);
  return updated;
}

export async function deleteMasterResume(id: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.masterResumes.length;
  store.masterResumes = store.masterResumes.filter((r) => r.id !== id);
  if (store.masterResumes.length === before) return false;
  await saveStore(store);
  return true;
}
