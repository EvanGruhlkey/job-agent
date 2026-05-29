export { SKILL_PATTERNS, normalizeSkill } from "./skill-dictionary";
export { extractSkillsFromText, type ExtractedSkill } from "./extract-skills-from-text";
export { parseJobPostingSkills, type ParsedJobSkills } from "./parse-job-posting";
export {
  buildEvidenceFromGitHub,
  buildEvidenceFromResume,
  mergeEvidenceItems,
} from "./build-evidence-items";
export {
  buildFitAnalysis,
  calculateFitScore,
  type FitScoreBreakdown,
} from "./analyze-fit";
export { runPacketAnalysis, type PacketAnalysisResult } from "./run-packet-analysis";
