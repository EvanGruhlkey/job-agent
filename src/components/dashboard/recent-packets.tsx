import Link from "next/link";

import type { DashboardPacketRow } from "@/lib/dashboard/get-dashboard-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecentPackets({ packets }: { packets: DashboardPacketRow[] }) {
  if (packets.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No application packets yet.{" "}
        <Link
          href="/applications/new"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Create one
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
      {packets.map((packet) => (
        <li key={packet.id}>
          <Link
            href={`/applications/${packet.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">
                {packet.company} — {packet.role}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDate(packet.createdAt)} · {packet.status}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-zinc-600">
              {packet.fitScore !== null ? `${packet.fitScore}% fit` : "—"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
