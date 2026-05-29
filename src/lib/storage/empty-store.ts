import type { ApplyKitStore } from "./schema";

export function createEmptyStore(): ApplyKitStore {
  return {
    userProfile: null,
    masterResumes: [],
    jobPostings: [],
    evidenceItems: [],
    applicationPackets: [],
    changeLogItems: [],
    fitAnalyses: [],
    resumeVersions: [],
    githubProfile: null,
  };
}
