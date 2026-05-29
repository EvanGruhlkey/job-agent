"use client";

import { useState } from "react";

import type { ApplicationPageData } from "@/lib/application/get-application-page-data";
import type { ChangeLogItem, EvidenceItem } from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "resume", label: "Resume" },
  { id: "evidence", label: "Evidence" },
  { id: "changelog", label: "Change Log" },
  { id: "job", label: "Job Description" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function EmptyBlock({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-sm text-zinc-600">
      {message}
    </p>
  );
}

function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="rounded-md bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-600">
        Not analyzed
      </span>
    );
  }
  return (
    <span className="rounded-md bg-zinc-900 px-2 py-1 text-sm font-semibold tabular-nums text-white">
      {score}% fit
    </span>
  );
}

function MatchList({
  title,
  matches,
  emptyMessage,
}: {
  title: string;
  matches: { skill: string; notes?: string }[];
  emptyMessage: string;
}) {
  if (matches.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
      <ul className="mt-2 space-y-2">
        {matches.map((match) => (
          <li
            key={match.skill}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
          >
            <span className="font-medium text-zinc-900">{match.skill}</span>
            {match.notes ? (
              <p className="mt-0.5 text-zinc-600">{match.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab({ data }: { data: ApplicationPageData }) {
  const { packet, job } = data;
  const analysis = packet.fitAnalysis;
  const warnings = packet.changeLog.filter((c) => c.type === "warning");

  const risks = [
    ...(analysis?.risks ?? []),
    ...warnings.map((w) => w.reason),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <FitScoreBadge score={packet.fitScore} />
        <span className="text-sm text-zinc-600 capitalize">Status: {packet.status}</span>
        <span className="text-sm text-zinc-500">
          Master resume: {data.masterResumeTitle}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MatchList
          title="Strong matches"
          matches={analysis?.strongMatches ?? []}
          emptyMessage="No strong matches yet."
        />
        <MatchList
          title="Weak matches"
          matches={analysis?.weakMatches ?? []}
          emptyMessage="No weak matches."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Missing skills</h3>
          {analysis?.missingSkills.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">
              None identified yet.
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Evidence used</h3>
          <p className="mt-2 text-sm text-zinc-600">
            {packet.evidence.length} item{packet.evidence.length === 1 ? "" : "s"}{" "}
            from resume
            {packet.evidence.some((e) => e.sourceType === "github")
              ? " and GitHub"
              : ""}
            .
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-900">Risks & warnings</h3>
        {risks.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {risks.map((risk, index) => (
              <li
                key={`${risk}-${index}`}
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
              >
                {risk}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">No risks or warnings.</p>
        )}
      </div>

      {analysis?.recommendations.length ? (
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Recommendations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {analysis.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-medium text-zinc-900">Job summary</h3>
        <p className="mt-2 line-clamp-4 text-sm text-zinc-700 whitespace-pre-wrap">
          {job.description}
        </p>
      </div>

      {job.applicationUrl ? (
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Apply to this role
        </a>
      ) : (
        <p className="text-sm text-zinc-500">No application URL on file.</p>
      )}
    </div>
  );
}

function ResumeTab({ data }: { data: ApplicationPageData }) {
  const latex =
    data.packet.tailoredLatex ??
    data.packet.resumeVersions[0]?.latexSource ??
    null;

  if (!latex) {
    return (
      <EmptyBlock message="No tailored LaTeX yet. Resume tailoring runs in a later step." />
    );
  }

  return (
    <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-900">
      {latex}
    </pre>
  );
}

function EvidenceTab({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return (
      <EmptyBlock message="No evidence linked to this packet yet. Evidence collection runs in a later step." />
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
      {evidence.map((item) => (
        <li key={item.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-900">{item.skill}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
              {item.sourceType}
            </span>
            <span className="text-xs text-zinc-500">
              {Math.round(item.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-700">{item.claim}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{item.proofText}</p>
        </li>
      ))}
    </ul>
  );
}

function ChangeLogTab({ items }: { items: ChangeLogItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyBlock message="No changes recorded yet. Changes appear after tailoring." />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium capitalize text-zinc-900">
              {item.type}
            </span>
            {item.evidenceIds.length > 0 ? (
              <span className="text-xs text-zinc-500">
                {item.evidenceIds.length} evidence ref
                {item.evidenceIds.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-zinc-700">{item.reason}</p>
          {item.before || item.after ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {item.before ? (
                <div>
                  <p className="text-xs font-medium text-zinc-500">Before</p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-700">
                    {item.before}
                  </p>
                </div>
              ) : null}
              {item.after ? (
                <div>
                  <p className="text-xs font-medium text-zinc-500">After</p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-700">
                    {item.after}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function JobDescriptionTab({ data }: { data: ApplicationPageData }) {
  const { job } = data;

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Company
          </dt>
          <dd className="mt-0.5 text-zinc-900">{job.company}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Role
          </dt>
          <dd className="mt-0.5 text-zinc-900">{job.title}</dd>
        </div>
        {job.location ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Location
            </dt>
            <dd className="mt-0.5 text-zinc-900">{job.location}</dd>
          </div>
        ) : null}
        {job.applicationUrl ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Application URL
            </dt>
            <dd className="mt-0.5">
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline-offset-2 hover:underline"
              >
                {job.applicationUrl}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <div>
        <h3 className="text-sm font-medium text-zinc-900">Description</h3>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800">
          {job.description}
        </pre>
      </div>

      {job.requirements.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Requirements</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {job.requirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {job.niceToHaves.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Nice to haves</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {job.niceToHaves.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PacketDetailTabs({ data }: { data: ApplicationPageData }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto border-b border-zinc-200"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6" role="tabpanel">
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "resume" && <ResumeTab data={data} />}
        {activeTab === "evidence" && (
          <EvidenceTab evidence={data.packet.evidence} />
        )}
        {activeTab === "changelog" && (
          <ChangeLogTab items={data.packet.changeLog} />
        )}
        {activeTab === "job" && <JobDescriptionTab data={data} />}
      </div>
    </div>
  );
}
