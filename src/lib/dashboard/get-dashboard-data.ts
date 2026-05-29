import { loadStore } from "@/lib/storage";
import type { ApplicationPacketStatus } from "@/lib/types";

export type DashboardPacketRow = {
  id: string;
  company: string;
  role: string;
  fitScore: number | null;
  status: ApplicationPacketStatus;
  createdAt: string;
};

export type DashboardData = {
  masterResume: {
    configured: boolean;
    count: number;
    title: string | null;
    updatedAt: string | null;
  };
  github: {
    connected: boolean;
    username: string | null;
    repoCount: number;
  };
  stats: {
    resumesGenerated: number;
    averageFitScore: number | null;
    jobsAnalyzed: number;
  };
  recentPackets: DashboardPacketRow[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const store = await loadStore();

  const primaryResume = store.masterResumes[0] ?? null;
  const githubUsername =
    store.githubProfile?.username ??
    store.userProfile?.githubUsername ??
    null;
  const githubConnected = Boolean(githubUsername);

  const scoredPackets = store.applicationPackets.filter(
    (p) => p.fitScore !== null,
  );
  const averageFitScore =
    scoredPackets.length > 0
      ? Math.round(
          (scoredPackets.reduce((sum, p) => sum + (p.fitScore ?? 0), 0) /
            scoredPackets.length) *
            10,
        ) / 10
      : null;

  const analyzedJobIds = new Set(
    store.applicationPackets
      .filter(
        (p) =>
          p.fitScore !== null ||
          store.fitAnalyses.some((f) => f.packetId === p.id),
      )
      .map((p) => p.jobPostingId),
  );

  const jobById = new Map(store.jobPostings.map((j) => [j.id, j]));

  const recentPackets = [...store.applicationPackets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((packet) => {
      const job = jobById.get(packet.jobPostingId);
      return {
        id: packet.id,
        company: job?.company ?? "Unknown company",
        role: job?.title ?? "Unknown role",
        fitScore: packet.fitScore,
        status: packet.status,
        createdAt: packet.createdAt,
      };
    });

  return {
    masterResume: {
      configured: store.masterResumes.length > 0,
      count: store.masterResumes.length,
      title: primaryResume?.title ?? null,
      updatedAt: primaryResume?.updatedAt ?? null,
    },
    github: {
      connected: githubConnected,
      username: githubUsername,
      repoCount: store.githubProfile?.repos.length ?? 0,
    },
    stats: {
      resumesGenerated: store.resumeVersions.length,
      averageFitScore,
      jobsAnalyzed: analyzedJobIds.size,
    },
    recentPackets,
  };
}
