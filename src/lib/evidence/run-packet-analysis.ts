import {
  getApplicationPacket,
  getJobPosting,
  getMasterResume,
} from "@/lib/storage";
import { getGitHubProfile } from "@/lib/storage/github-profile";
import { persistPacketAnalysis } from "@/lib/storage/packet-analysis";
import type { FitAnalysis, FitAnalysisRecord } from "@/lib/types";

import {
  buildEvidenceFromGitHub,
  buildEvidenceFromResume,
  mergeEvidenceItems,
} from "./build-evidence-items";
import { buildFitAnalysis, calculateFitScore } from "./analyze-fit";
import { parseJobPostingSkills } from "./parse-job-posting";

export type PacketAnalysisResult = {
  packetId: string;
  fitScore: number;
  evidenceCount: number;
};

/**
 * Collects evidence from resume + GitHub, maps skills to the job, and persists fit analysis.
 */
export async function runPacketAnalysis(
  packetId: string,
): Promise<PacketAnalysisResult | null> {
  const packet = await getApplicationPacket(packetId);
  if (!packet) return null;

  const [job, resume, github] = await Promise.all([
    getJobPosting(packet.jobPostingId),
    getMasterResume(packet.masterResumeId),
    getGitHubProfile(),
  ]);

  if (!job || !resume) return null;

  const parsed = parseJobPostingSkills(job.description);

  const resumeEvidence = buildEvidenceFromResume(resume, packetId);
  const githubEvidence = github
    ? buildEvidenceFromGitHub(github, packetId)
    : [];
  const evidence = mergeEvidenceItems(resumeEvidence, githubEvidence);

  const breakdown = calculateFitScore(parsed, evidence);
  const fitAnalysis: FitAnalysis = buildFitAnalysis(parsed, evidence, breakdown);

  const fitAnalysisRecord: FitAnalysisRecord = {
    packetId,
    ...fitAnalysis,
  };

  await persistPacketAnalysis({
    packetId,
    jobPostingId: job.id,
    evidence,
    fitAnalysis: fitAnalysisRecord,
    fitScore: breakdown.score,
    requirements: parsed.requirements,
    niceToHaves: parsed.niceToHaves,
  });

  return {
    packetId,
    fitScore: breakdown.score,
    evidenceCount: evidence.length,
  };
}
