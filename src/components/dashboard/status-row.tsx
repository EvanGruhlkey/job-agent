import Link from "next/link";

export function StatusRow({
  label,
  status,
  detail,
  href,
  actionLabel,
}: {
  label: string;
  status: "ok" | "missing" | "partial";
  detail: string;
  href: string;
  actionLabel: string;
}) {
  const statusStyles = {
    ok: "bg-emerald-50 text-emerald-800",
    missing: "bg-amber-50 text-amber-800",
    partial: "bg-zinc-100 text-zinc-700",
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
          >
            {status === "ok" ? "Ready" : status === "partial" ? "Partial" : "Missing"}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{detail}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 text-sm font-medium text-zinc-900 underline-offset-2 hover:underline"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
