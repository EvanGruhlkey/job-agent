"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import {
  saveMasterResume,
  type SaveMasterResumeState,
} from "@/app/(app)/resume/actions";

const initialState: SaveMasterResumeState | null = null;

export function ResumeEditor({
  resumeId,
  title,
  latexSource,
}: {
  resumeId: string | null;
  title: string;
  latexSource: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    saveMasterResume,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="resumeId" value={resumeId ?? ""} />

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-900"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={title}
          className="mt-1 w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label
          htmlFor="latexSource"
          className="block text-sm font-medium text-zinc-900"
        >
          LaTeX source
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          This is the source of truth. Tailoring only reuses content backed by
          evidence.
        </p>
        <textarea
          id="latexSource"
          name="latexSource"
          rows={24}
          defaultValue={latexSource}
          spellCheck={false}
          placeholder={"\\documentclass{article}\n\\begin{document}\n% Your resume content\n\\end{document}"}
          className="mt-2 w-full resize-y rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm leading-relaxed text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : resumeId ? "Save changes" : "Create master resume"}
        </button>
        {state ? (
          <p
            className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}
            role="status"
          >
            {state.message}
            {state.ok && state.updatedAt
              ? ` · ${new Date(state.updatedAt).toLocaleString()}`
              : null}
          </p>
        ) : null}
      </div>
    </form>
  );
}
