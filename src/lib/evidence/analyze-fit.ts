import type { EvidenceItem, FitAnalysis, FitMatch } from "@/lib/types";

import type { ParsedJobSkills } from "./parse-job-posting";

export type FitScoreBreakdown = {
  score: number;
  requiredTotal: number;
  requiredMatched: number;
  niceTotal: number;
  niceMatched: number;
  formula: string;
};

function matchSkill(jobSkill: string, evidence: EvidenceItem[]): EvidenceItem | null {
  const normalized = jobSkill.toLowerCase();
  return (
    evidence.find((e) => e.skill.toLowerCase() === normalized) ??
    evidence.find(
      (e) =>
        e.skill.toLowerCase().includes(normalized) ||
        normalized.includes(e.skill.toLowerCase()),
    ) ??
    null
  );
}

function buildMatches(
  skills: string[],
  evidence: EvidenceItem[],
  minConfidence: number,
): FitMatch[] {
  const matches: FitMatch[] = [];

  for (const skill of skills) {
    const item = matchSkill(skill, evidence);
    if (!item || item.confidence < minConfidence) continue;
    matches.push({
      skill,
      evidenceIds: [item.id],
      notes:
        item.confidence < 0.75
          ? `Supported with moderate confidence (${Math.round(item.confidence * 100)}%).`
          : undefined,
    });
  }

  return matches;
}

/**
 * Transparent fit score:
 * 75% weight on required skills coverage, 25% on nice-to-have coverage.
 * If no required skills were parsed, uses all mentioned job skills as required.
 */
export function calculateFitScore(
  parsed: ParsedJobSkills,
  evidence: EvidenceItem[],
): FitScoreBreakdown {
  const required =
    parsed.requirements.length > 0 ? parsed.requirements : parsed.allMentioned;
  const nice = parsed.niceToHaves;

  const requiredMatched = required.filter((s) => matchSkill(s, evidence)).length;
  const niceMatched = nice.filter((s) => matchSkill(s, evidence)).length;

  const requiredRatio =
    required.length > 0 ? requiredMatched / required.length : 0;
  const niceRatio = nice.length > 0 ? niceMatched / nice.length : 0;

  const weighted =
    required.length > 0 && nice.length > 0
      ? requiredRatio * 0.75 + niceRatio * 0.25
      : required.length > 0
        ? requiredRatio
        : nice.length > 0
          ? niceRatio
          : evidence.length > 0
            ? 0.5
            : 0;

  const score = Math.round(weighted * 100);

  return {
    score,
    requiredTotal: required.length,
    requiredMatched,
    niceTotal: nice.length,
    niceMatched,
    formula:
      "fit = round((requiredMatched/requiredTotal)×0.75 + (niceMatched/niceTotal)×0.25)×100; falls back to single bucket when one list is empty",
  };
}

export function buildFitAnalysis(
  parsed: ParsedJobSkills,
  evidence: EvidenceItem[],
  breakdown: FitScoreBreakdown,
): FitAnalysis {
  const required =
    parsed.requirements.length > 0 ? parsed.requirements : parsed.allMentioned;

  const strongMatches = buildMatches(
    [...required, ...parsed.niceToHaves],
    evidence,
    0.7,
  );

  const matchedSkills = new Set(strongMatches.map((m) => m.skill.toLowerCase()));

  const weakMatches: FitMatch[] = [];
  for (const skill of required) {
    if (matchedSkills.has(skill.toLowerCase())) continue;
    const item = matchSkill(skill, evidence);
    if (item && item.confidence >= 0.5 && item.confidence < 0.7) {
      weakMatches.push({
        skill,
        evidenceIds: [item.id],
        notes: "Weak or indirect evidence.",
      });
    }
  }

  const missingSkills = required.filter(
    (s) => !matchSkill(s, evidence) || (matchSkill(s, evidence)?.confidence ?? 0) < 0.5,
  );

  const risks: string[] = [];
  if (missingSkills.length > 0) {
    risks.push(
      `Missing evidence for: ${missingSkills.slice(0, 5).join(", ")}${missingSkills.length > 5 ? "…" : ""}.`,
    );
  }
  if (evidence.length === 0) {
    risks.push("No evidence items found from resume or GitHub.");
  }
  if (breakdown.score < 50) {
    risks.push("Overall fit is below 50% — consider strengthening evidence before tailoring.");
  }

  const recommendations: string[] = [];
  if (missingSkills.length > 0) {
    recommendations.push(
      "Add provable projects or bullets for missing skills, or confirm you should not claim them.",
    );
  }
  if (evidence.every((e) => e.sourceType === "resume")) {
    recommendations.push(
      "Connect GitHub to back engineering claims with repository evidence.",
    );
  }

  return {
    strongMatches,
    weakMatches,
    missingSkills,
    risks,
    recommendations,
  };
}
