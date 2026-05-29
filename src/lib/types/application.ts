import type { EvidenceItem } from "./evidence";
import type { ResumeVersion } from "./resume";

export type ApplicationPacketStatus =
  | "draft"
  | "analyzing"
  | "tailored"
  | "ready"
  | "archived";

export type ChangeLogType =
  | "added"
  | "removed"
  | "reordered"
  | "rewritten"
  | "warning";

export type FitMatch = {
  skill: string;
  evidenceIds: string[];
  notes?: string;
};

export type FitAnalysis = {
  strongMatches: FitMatch[];
  weakMatches: FitMatch[];
  missingSkills: string[];
  risks: string[];
  recommendations: string[];
};

/** Fit analysis persisted per application packet. */
export type FitAnalysisRecord = FitAnalysis & {
  packetId: string;
};

export type ChangeLogItem = {
  id: string;
  packetId: string;
  type: ChangeLogType;
  before: string | null;
  after: string | null;
  reason: string;
  evidenceIds: string[];
};

/**
 * Everything needed to apply to one job: analysis, tailored output, and audit trail.
 */
export type ApplicationPacket = {
  id: string;
  jobPostingId: string;
  masterResumeId: string;
  fitScore: number | null;
  tailoredLatex: string | null;
  status: ApplicationPacketStatus;
  createdAt: string;
  updatedAt: string;
};

/** Full packet view with joined entities (used by UI and CLI later). */
export type ApplicationPacketDetail = ApplicationPacket & {
  fitAnalysis: FitAnalysis | null;
  changeLog: ChangeLogItem[];
  evidence: EvidenceItem[];
  resumeVersions: ResumeVersion[];
};
