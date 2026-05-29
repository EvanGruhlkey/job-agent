import {
  getApplicationPacketDetail,
  getJobPosting,
  getMasterResume,
} from "@/lib/storage";
import type {
  ApplicationPacketDetail,
  JobPosting,
} from "@/lib/types";

export type ApplicationPageData = {
  packet: ApplicationPacketDetail;
  job: JobPosting;
  masterResumeTitle: string;
};

export async function getApplicationPageData(
  id: string,
): Promise<ApplicationPageData | null> {
  const packet = await getApplicationPacketDetail(id);
  if (!packet) return null;

  const job = await getJobPosting(packet.jobPostingId);
  if (!job) return null;

  const masterResume = await getMasterResume(packet.masterResumeId);

  return {
    packet,
    job,
    masterResumeTitle: masterResume?.title ?? "Unknown resume",
  };
}
