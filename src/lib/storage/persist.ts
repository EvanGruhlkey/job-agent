import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { createEmptyStore } from "./empty-store";
import type { ApplyKitStore } from "./schema";

const STORE_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(STORE_DIR, "store.json");

function normalizeStore(raw: unknown): ApplyKitStore {
  const empty = createEmptyStore();
  if (!raw || typeof raw !== "object") return empty;

  const data = raw as Partial<ApplyKitStore>;
  return {
    userProfile: data.userProfile ?? empty.userProfile,
    masterResumes: data.masterResumes ?? empty.masterResumes,
    jobPostings: data.jobPostings ?? empty.jobPostings,
    evidenceItems: data.evidenceItems ?? empty.evidenceItems,
    applicationPackets:
      data.applicationPackets ?? empty.applicationPackets,
    changeLogItems: data.changeLogItems ?? empty.changeLogItems,
    fitAnalyses: data.fitAnalyses ?? empty.fitAnalyses,
    resumeVersions: data.resumeVersions ?? empty.resumeVersions,
    githubProfile: data.githubProfile ?? empty.githubProfile,
  };
}

async function ensureStoreFile(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    const empty = createEmptyStore();
    await writeFile(STORE_PATH, JSON.stringify(empty, null, 2), "utf8");
  }
}

export function getStorePath(): string {
  return STORE_PATH;
}

export async function loadStore(): Promise<ApplyKitStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  return normalizeStore(JSON.parse(raw) as unknown);
}

export async function saveStore(store: ApplyKitStore): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function withStore<T>(
  fn: (store: ApplyKitStore) => T | Promise<T>,
): Promise<T> {
  const store = await loadStore();
  const result = await fn(store);
  await saveStore(store);
  return result;
}
