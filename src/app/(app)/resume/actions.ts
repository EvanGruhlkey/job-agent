"use server";

import { revalidatePath } from "next/cache";

import { createId } from "@/lib/storage/id";
import {
  createMasterResume,
  updateMasterResume,
} from "@/lib/storage/master-resume";
import { getUserProfile, upsertUserProfile } from "@/lib/storage/user";

export type SaveMasterResumeState = {
  ok: boolean;
  message: string;
  resumeId?: string;
  updatedAt?: string;
};

async function ensureLocalUserId(): Promise<string> {
  const existing = await getUserProfile();
  if (existing) return existing.id;

  const profile = {
    id: createId(),
    name: "Local user",
    email: "",
    githubUsername: null,
    targetRoles: [] as string[],
  };
  await upsertUserProfile(profile);
  return profile.id;
}

export async function saveMasterResume(
  _prev: SaveMasterResumeState | null,
  formData: FormData,
): Promise<SaveMasterResumeState> {
  const resumeId = String(formData.get("resumeId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || "Master resume";
  const latexSource = String(formData.get("latexSource") ?? "");

  if (!latexSource.trim()) {
    return { ok: false, message: "LaTeX source cannot be empty." };
  }

  try {
    if (resumeId) {
      const updated = await updateMasterResume(resumeId, {
        title,
        latexSource,
      });
      if (!updated) {
        return { ok: false, message: "Resume not found." };
      }
      revalidatePath("/resume");
      revalidatePath("/dashboard");
      return {
        ok: true,
        message: "Saved.",
        resumeId: updated.id,
        updatedAt: updated.updatedAt,
      };
    }

    const userId = await ensureLocalUserId();
    const created = await createMasterResume({
      userId,
      title,
      latexSource,
    });
    revalidatePath("/resume");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Created master resume.",
      resumeId: created.id,
      updatedAt: created.updatedAt,
    };
  } catch {
    return { ok: false, message: "Failed to save resume." };
  }
}
