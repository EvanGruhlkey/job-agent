/** Where a piece of evidence originated. */
export type EvidenceSourceType = "resume" | "github" | "user_input";

/**
 * A single verifiable claim tied to a skill, backed by source text.
 * The tailoring engine must reference these; it must not invent claims.
 */
export type EvidenceItem = {
  id: string;
  sourceType: EvidenceSourceType;
  sourceName: string;
  skill: string;
  claim: string;
  proofText: string;
  /** 0–1 confidence in how well proofText supports the claim */
  confidence: number;
};
