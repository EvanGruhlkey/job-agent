export function ResumeMetadata({
  resumeId,
  createdAt,
  updatedAt,
  characterCount,
  lineCount,
}: {
  resumeId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  characterCount: number;
  lineCount: number;
}) {
  function format(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  return (
    <dl className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Status
        </dt>
        <dd className="mt-0.5 font-medium text-zinc-900">
          {resumeId ? "Saved" : "Not created"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Created
        </dt>
        <dd className="mt-0.5 text-zinc-700">{format(createdAt)}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Last updated
        </dt>
        <dd className="mt-0.5 text-zinc-700">{format(updatedAt)}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Characters
        </dt>
        <dd className="mt-0.5 tabular-nums text-zinc-700">{characterCount}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Lines
        </dt>
        <dd className="mt-0.5 tabular-nums text-zinc-700">{lineCount}</dd>
      </div>
      {resumeId ? (
        <div className="sm:col-span-2 lg:col-span-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Resume ID
          </dt>
          <dd className="mt-0.5 truncate font-mono text-xs text-zinc-600">
            {resumeId}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
