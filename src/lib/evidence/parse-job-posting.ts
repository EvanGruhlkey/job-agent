import { extractSkillsFromText } from "./extract-skills-from-text";
import { normalizeSkill } from "./skill-dictionary";

export type ParsedJobSkills = {
  requirements: string[];
  niceToHaves: string[];
  allMentioned: string[];
};

const NICE_SECTION_PATTERNS = [
  /nice to have[s]?:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i,
  /preferred(?: qualifications)?:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i,
  /bonus:([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i,
];

const REQUIRED_SECTION_PATTERNS = [
  /requirements?:([\s\S]*?)(?:\n\n|nice to have|preferred|responsibilities|$)/i,
  /qualifications?:([\s\S]*?)(?:\n\n|nice to have|preferred|responsibilities|$)/i,
  /must have:([\s\S]*?)(?:\n\n|nice to have|preferred|$)/i,
];

function skillsFromSection(section: string): string[] {
  const fromDictionary = extractSkillsFromText(section).map((s) => s.skill);
  const fromBullets = section
    .split("\n")
    .map((line) => line.replace(/^[\s\-*•]+/, "").trim())
    .filter((line) => line.length > 3 && line.length < 120)
    .flatMap((line) => extractSkillsFromText(line).map((s) => s.skill));

  return [...new Set([...fromDictionary, ...fromBullets].map(normalizeSkill))];
}

function extractSection(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

/**
 * Rule-based parse of requirements vs nice-to-haves from a job description.
 */
export function parseJobPostingSkills(description: string): ParsedJobSkills {
  const niceSection = extractSection(description, NICE_SECTION_PATTERNS);
  const requiredSection = extractSection(description, REQUIRED_SECTION_PATTERNS);

  let requirements = skillsFromSection(requiredSection);
  let niceToHaves = skillsFromSection(niceSection);

  const allMentioned = extractSkillsFromText(description).map((s) => s.skill);

  if (requirements.length === 0) {
    requirements = [...new Set(allMentioned)];
    niceToHaves = niceToHaves.filter((s) => !requirements.includes(s));
  }

  if (niceToHaves.length === 0) {
    niceToHaves = allMentioned.filter((s) => !requirements.includes(s));
  }

  return {
    requirements: [...new Set(requirements)],
    niceToHaves: [...new Set(niceToHaves)],
    allMentioned: [...new Set(allMentioned)],
  };
}
