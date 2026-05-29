import Link from "next/link";
import { notFound } from "next/navigation";

import { PacketDetailTabs } from "@/components/applications/packet-detail-tabs";
import { PageHeader } from "@/components/page-header";
import { getApplicationPageData } from "@/lib/application/get-application-page-data";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getApplicationPageData(id);

  if (!data) {
    notFound();
  }

  const { job, packet } = data;

  return (
    <>
      <PageHeader
        title={`${job.company} — ${job.title}`}
        description={`Application packet · ${packet.status} · updated ${new Date(packet.updatedAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            {job.applicationUrl ? (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Apply
              </a>
            ) : null}
            <Link
              href="/applications"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back
            </Link>
          </div>
        }
      />
      <div className="px-6">
        <PacketDetailTabs data={data} />
      </div>
    </>
  );
}
