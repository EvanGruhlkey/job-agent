import { createId } from "@/lib/storage/id";
import type { EvidenceItem, GitHubEvidenceProfile, MasterResume } from "@/lib/types";

import { extractSkillsFromText } from "./extract-skills-from-text";

export function buildEvidenceFromResume(
  resume: MasterResume,
  packetId: string,
): EvidenceItem[] {
  const extracted = extractSkillsFromText(resume.latexSource, {
    stripLatex: true,
  });

  return extracted.map((item) => ({
    id: createId(),
    packetId,
    sourceType: "resume" as const,
    sourceName: resume.title,
    skill: item.skill,
    claim: `Resume documents experience with ${item.skill}.`,
    proofText: item.proofText,
    confidence: 0.85,
  }));
}

export function buildEvidenceFromGitHub(
  profile: GitHubEvidenceProfile,
  packetId: string,
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const repo of profile.repos) {
    const repoText = [
      repo.name,
      repo.description ?? "",
      repo.language ?? "",
      repo.topics.join(" "),
      repo.readmeExcerpt ?? "",
    ].join(" ");

    const skills = extractSkillsFromText(repoText);
    for (const skill of skills) {
      items.push({
        id: createId(),
        packetId,
        sourceType: "github",
        sourceName: `${profile.username}/${repo.name}`,
        skill: skill.skill,
        claim: `GitHub repo ${repo.name} relates to ${skill.skill}.`,
        proofText: skill.proofText || repo.description || repo.name,
        confidence: repo.readmeExcerpt ? 0.75 : 0.65,
      });
    }
  }

  const bySkill = new Map<string, EvidenceItem>();
  for (const item of items) {
    const existing = bySkill.get(item.skill);
    if (!existing || item.confidence > existing.confidence) {
      bySkill.set(item.skill, item);
    }
  }

  return [...bySkill.values()];
}

export function mergeEvidenceItems(
  resumeItems: EvidenceItem[],
  githubItems: EvidenceItem[],
): EvidenceItem[] {
  const bySkill = new Map<string, EvidenceItem>();

  for (const item of [...resumeItems, ...githubItems]) {
    const existing = bySkill.get(item.skill);
    if (!existing || item.confidence > existing.confidence) {
      bySkill.set(item.skill, item);
    }
  }

  return [...bySkill.values()];
}
