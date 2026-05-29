import type {
  ApplicationPacket,
  ApplicationPacketDetail,
  ApplicationPacketStatus,
  ChangeLogItem,
  FitAnalysisRecord,
  ResumeVersion,
} from "@/lib/types";

import { createId, nowIso } from "./id";
import { loadStore, saveStore } from "./persist";

export async function listApplicationPackets(): Promise<ApplicationPacket[]> {
  const store = await loadStore();
  return [...store.applicationPackets].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getApplicationPacket(
  id: string,
): Promise<ApplicationPacket | null> {
  const store = await loadStore();
  return store.applicationPackets.find((p) => p.id === id) ?? null;
}

export async function createApplicationPacket(input: {
  jobPostingId: string;
  masterResumeId: string;
  status?: ApplicationPacketStatus;
}): Promise<ApplicationPacket> {
  const store = await loadStore();
  const timestamp = nowIso();
  const packet: ApplicationPacket = {
    id: createId(),
    jobPostingId: input.jobPostingId,
    masterResumeId: input.masterResumeId,
    fitScore: null,
    tailoredLatex: null,
    status: input.status ?? "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.applicationPackets.push(packet);
  await saveStore(store);
  return packet;
}

export async function updateApplicationPacket(
  id: string,
  patch: Partial<
    Pick<
      ApplicationPacket,
      "fitScore" | "tailoredLatex" | "status" | "masterResumeId"
    >
  >,
): Promise<ApplicationPacket | null> {
  const store = await loadStore();
  const index = store.applicationPackets.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: ApplicationPacket = {
    ...store.applicationPackets[index],
    ...patch,
    updatedAt: nowIso(),
  };
  store.applicationPackets[index] = updated;
  await saveStore(store);
  return updated;
}

export async function getFitAnalysis(
  packetId: string,
): Promise<FitAnalysisRecord | null> {
  const store = await loadStore();
  return store.fitAnalyses.find((f) => f.packetId === packetId) ?? null;
}

export async function upsertFitAnalysis(
  record: FitAnalysisRecord,
): Promise<FitAnalysisRecord> {
  const store = await loadStore();
  const index = store.fitAnalyses.findIndex(
    (f) => f.packetId === record.packetId,
  );
  if (index === -1) {
    store.fitAnalyses.push(record);
  } else {
    store.fitAnalyses[index] = record;
  }
  await saveStore(store);
  return record;
}

export async function listChangeLogItems(
  packetId: string,
): Promise<ChangeLogItem[]> {
  const store = await loadStore();
  return store.changeLogItems.filter((c) => c.packetId === packetId);
}

export async function addChangeLogItem(
  input: Omit<ChangeLogItem, "id">,
): Promise<ChangeLogItem> {
  const store = await loadStore();
  const item: ChangeLogItem = { id: createId(), ...input };
  store.changeLogItems.push(item);
  await saveStore(store);
  return item;
}

export async function listResumeVersions(
  packetId: string,
): Promise<ResumeVersion[]> {
  const store = await loadStore();
  return store.resumeVersions
    .filter((v) => v.applicationPacketId === packetId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createResumeVersion(
  input: Pick<
    ResumeVersion,
    "applicationPacketId" | "masterResumeId" | "label" | "latexSource"
  >,
): Promise<ResumeVersion> {
  const store = await loadStore();
  const version: ResumeVersion = {
    id: createId(),
    applicationPacketId: input.applicationPacketId,
    masterResumeId: input.masterResumeId,
    label: input.label,
    latexSource: input.latexSource,
    createdAt: nowIso(),
  };
  store.resumeVersions.push(version);
  await saveStore(store);
  return version;
}

export async function getApplicationPacketDetail(
  id: string,
): Promise<ApplicationPacketDetail | null> {
  const store = await loadStore();
  const packet = store.applicationPackets.find((p) => p.id === id);
  if (!packet) return null;

  const fitAnalysis =
    store.fitAnalyses.find((f) => f.packetId === id) ?? null;

  const evidenceIds = new Set(
    store.changeLogItems
      .filter((c) => c.packetId === id)
      .flatMap((c) => c.evidenceIds),
  );
  if (fitAnalysis) {
    for (const match of [
      ...fitAnalysis.strongMatches,
      ...fitAnalysis.weakMatches,
    ]) {
      for (const evidenceId of match.evidenceIds) {
        evidenceIds.add(evidenceId);
      }
    }
  }

  const evidenceForPacket = store.evidenceItems.filter(
    (e) => e.packetId === id || evidenceIds.has(e.id),
  );

  return {
    ...packet,
    fitAnalysis,
    changeLog: store.changeLogItems.filter((c) => c.packetId === id),
    evidence: evidenceForPacket,
    resumeVersions: store.resumeVersions.filter(
      (v) => v.applicationPacketId === id,
    ),
  };
}
