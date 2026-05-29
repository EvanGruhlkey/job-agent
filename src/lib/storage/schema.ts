import type {
  ApplicationPacket,
  ChangeLogItem,
  EvidenceItem,
  FitAnalysisRecord,
  GitHubEvidenceProfile,
  JobPosting,
  MasterResume,
  ResumeVersion,
  UserProfile,
} from "@/lib/types";

/** On-disk JSON shape for the local ApplyKit store. */
export type ApplyKitStore = {
  userProfile: UserProfile | null;
  masterResumes: MasterResume[];
  jobPostings: JobPosting[];
  evidenceItems: EvidenceItem[];
  applicationPackets: ApplicationPacket[];
  changeLogItems: ChangeLogItem[];
  fitAnalyses: FitAnalysisRecord[];
  resumeVersions: ResumeVersion[];
  githubProfile: GitHubEvidenceProfile | null;
};
