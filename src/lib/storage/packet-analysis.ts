import type {
  EvidenceItem,
  FitAnalysisRecord,
} from "@/lib/types";

import { nowIso } from "./id";
import { loadStore, saveStore } from "./persist";

export async function persistPacketAnalysis(input: {
  packetId: string;
  jobPostingId: string;
  evidence: EvidenceItem[];
  fitAnalysis: FitAnalysisRecord;
  fitScore: number;
  requirements: string[];
  niceToHaves: string[];
}): Promise<void> {
  const store = await loadStore();

  store.evidenceItems = [
    ...store.evidenceItems.filter((e) => e.packetId !== input.packetId),
    ...input.evidence,
  ];

  const fitIndex = store.fitAnalyses.findIndex(
    (f) => f.packetId === input.packetId,
  );
  if (fitIndex === -1) {
    store.fitAnalyses.push(input.fitAnalysis);
  } else {
    store.fitAnalyses[fitIndex] = input.fitAnalysis;
  }

  const jobIndex = store.jobPostings.findIndex((j) => j.id === input.jobPostingId);
  if (jobIndex !== -1) {
    store.jobPostings[jobIndex] = {
      ...store.jobPostings[jobIndex],
      requirements: input.requirements,
      niceToHaves: input.niceToHaves,
    };
  }

  const packetIndex = store.applicationPackets.findIndex(
    (p) => p.id === input.packetId,
  );
  if (packetIndex !== -1) {
    store.applicationPackets[packetIndex] = {
      ...store.applicationPackets[packetIndex],
      fitScore: input.fitScore,
      status: "analyzing",
      updatedAt: nowIso(),
    };
  }

  await saveStore(store);
}
