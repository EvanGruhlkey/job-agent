import { listMasterResumes } from "@/lib/storage";
import type { MasterResume } from "@/lib/types";

/** Returns the first master resume, used as the canonical source for MVP. */
export async function getPrimaryMasterResume(): Promise<MasterResume | null> {
  const resumes = await listMasterResumes();
  return resumes[0] ?? null;
}
