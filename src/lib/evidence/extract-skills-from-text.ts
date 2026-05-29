import { normalizeSkill, SKILL_PATTERNS } from "./skill-dictionary";

export type ExtractedSkill = {
  skill: string;
  proofText: string;
};

function stripLatexCommands(text: string): string {
  return text
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProofExcerpt(text: string, skill: string, index: number): string {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + 60);
  const excerpt = text.slice(start, end).trim();
  return excerpt.length > 0 ? excerpt : skill;
}

/**
 * Finds skills from free text using the shared dictionary.
 */
export function extractSkillsFromText(
  rawText: string,
  options?: { stripLatex?: boolean },
): ExtractedSkill[] {
  const text = options?.stripLatex ? stripLatexCommands(rawText) : rawText;
  const lower = text.toLowerCase();
  const found = new Map<string, ExtractedSkill>();

  for (const entry of SKILL_PATTERNS) {
    for (const pattern of entry.patterns) {
      const match = pattern.exec(lower);
      if (!match || match.index === undefined) continue;

      const skill = normalizeSkill(entry.skill);
      if (found.has(skill)) continue;

      found.set(skill, {
        skill,
        proofText: findProofExcerpt(text, skill, match.index),
      });
      break;
    }
  }

  return [...found.values()];
}
