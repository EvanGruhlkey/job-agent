import Link from "next/link";

import { RecentPackets } from "@/components/dashboard/recent-packets";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusRow } from "@/components/dashboard/status-row";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

function formatUpdatedAt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const masterDetail = data.masterResume.configured
    ? `${data.masterResume.title ?? "Untitled"}${data.masterResume.count > 1 ? ` (+${data.masterResume.count - 1} more)` : ""}${formatUpdatedAt(data.masterResume.updatedAt) ? ` · updated ${formatUpdatedAt(data.masterResume.updatedAt)}` : ""}`
    : "Add your canonical LaTeX resume before tailoring applications.";

  const githubDetail = data.github.connected
    ? `@${data.github.username}${data.github.repoCount > 0 ? ` · ${data.github.repoCount} repos indexed` : " · profile linked, no repos indexed yet"}`
    : "Connect a GitHub username to pull project evidence.";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your resume, evidence sources, and application packets."
        actions={
          <Link
            href="/applications/new"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New application
          </Link>
        }
      />
      <div className="space-y-8 px-6 py-6">
        <section>
          <h2 className="text-sm font-medium text-zinc-900">Stats</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Resumes generated"
              value={String(data.stats.resumesGenerated)}
              hint="Tailored resume versions saved"
            />
            <StatCard
              label="Average fit score"
              value={
                data.stats.averageFitScore !== null
                  ? `${data.stats.averageFitScore}%`
                  : "—"
              }
              hint="Across packets with a fit score"
            />
            <StatCard
              label="Jobs analyzed"
              value={String(data.stats.jobsAnalyzed)}
              hint="Distinct roles with fit analysis"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-900">Setup status</h2>
          <div className="mt-3 space-y-2">
            <StatusRow
              label="Master resume"
              status={data.masterResume.configured ? "ok" : "missing"}
              detail={masterDetail}
              href="/resume"
              actionLabel={
                data.masterResume.configured ? "Edit" : "Set up"
              }
            />
            <StatusRow
              label="GitHub profile"
              status={
                data.github.connected
                  ? data.github.repoCount > 0
                    ? "ok"
                    : "partial"
                  : "missing"
              }
              detail={githubDetail}
              href="/settings"
              actionLabel={
                data.github.connected ? "Manage" : "Connect"
              }
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-medium text-zinc-900">
              Recent applications
            </h2>
            <Link
              href="/applications"
              className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-3">
            <RecentPackets packets={data.recentPackets} />
          </div>
        </section>
      </div>
    </>
  );
}
