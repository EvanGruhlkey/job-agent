/** Canonical skill labels and text patterns used for rule-based matching. */
export const SKILL_PATTERNS: { skill: string; patterns: RegExp[] }[] = [
  { skill: "TypeScript", patterns: [/\btypescript\b/i, /\bts\b/i] },
  { skill: "JavaScript", patterns: [/\bjavascript\b/i, /\bjs\b/i] },
  { skill: "Python", patterns: [/\bpython\b/i] },
  { skill: "Java", patterns: [/\bjava\b(?!script)/i] },
  { skill: "Go", patterns: [/\bgolang\b/i, /\bgo\b/i] },
  { skill: "Rust", patterns: [/\brust\b/i] },
  { skill: "React", patterns: [/\breact\.?js\b/i, /\breact\b/i] },
  { skill: "Next.js", patterns: [/\bnext\.?js\b/i] },
  { skill: "Node.js", patterns: [/\bnode\.?js\b/i] },
  { skill: "SQL", patterns: [/\bsql\b/i, /\bpostgres\b/i, /\bpostgresql\b/i, /\bmysql\b/i] },
  { skill: "AWS", patterns: [/\baws\b/i, /\bamazon web services\b/i] },
  { skill: "Docker", patterns: [/\bdocker\b/i] },
  { skill: "Kubernetes", patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { skill: "Git", patterns: [/\bgit\b/i, /\bgithub\b/i] },
  { skill: "CI/CD", patterns: [/\bci\/cd\b/i, /\bcontinuous integration\b/i] },
  { skill: "LaTeX", patterns: [/\blatex\b/i, /\btex\b/i] },
  { skill: "Machine Learning", patterns: [/\bmachine learning\b/i, /\bml\b/i] },
  { skill: "LLM", patterns: [/\bllm\b/i, /\blarge language model/i] },
  { skill: "REST APIs", patterns: [/\brest\b/i, /\brestful\b/i, /\bapi\b/i] },
  { skill: "GraphQL", patterns: [/\bgraphql\b/i] },
  { skill: "Tailwind CSS", patterns: [/\btailwind\b/i] },
  { skill: "Prisma", patterns: [/\bprisma\b/i] },
  { skill: "Redis", patterns: [/\bredis\b/i] },
  { skill: "MongoDB", patterns: [/\bmongodb\b/i, /\bmongo\b/i] },
  { skill: "System Design", patterns: [/\bsystem design\b/i] },
  { skill: "Agile", patterns: [/\bagile\b/i, /\bscrum\b/i] },
];

export function normalizeSkill(skill: string): string {
  const found = SKILL_PATTERNS.find(
    (entry) => entry.skill.toLowerCase() === skill.toLowerCase(),
  );
  return found?.skill ?? skill;
}
