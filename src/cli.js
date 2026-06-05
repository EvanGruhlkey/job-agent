import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractResumeInput } from "./resumeParser.js";
import { tailorResumeForJob } from "./tailor.js";
import { getLlmStatus, tailorResumeWithLlm } from "./llm.js";
import { loadIndexedJob, runJobDiscovery, searchIndexedJobs } from "./jobIndex/indexer.js";
import { jobIndexerSourceCatalogForClient } from "./jobIndex/adapters.js";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_JOBS_OUTPUT = path.join("data", "jobs.md");
const DEFAULT_TAILOR_OUTPUT = path.join("data", "tailored-resume.md");
const KNOWN_COMMANDS = new Set(["search", "find", "discover", "list", "jobs", "tailor", "sources", "status", "help"]);

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = resolveCommand(args);

  if (readBoolean(args, ["help", "h"], false) || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "search":
    case "find":
    case "discover":
      await runSearchCommand(args);
      return;
    case "list":
    case "jobs":
      await runListCommand(args);
      return;
    case "tailor":
      await runTailorCommand(args);
      return;
    case "sources":
      await runSourcesCommand(args);
      return;
    case "status":
      runStatusCommand();
      return;
    default:
      printHelp();
  }
}

async function runSearchCommand(args) {
  const targetTitle = normalizeSearchTitle(
    readOption(args, ["title", "t", "query", "q"]) || remainingPositionals(args).join(" ")
  );
  const location = String(readOption(args, ["location", "l"], "") || "").trim();
  const maxJobs = readInteger(args, ["max", "count", "limit", "n"], { min: 1, max: 250, fallback: 25 });
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_JOBS_OUTPUT));
  const format = resolveOutputFormat(args, outputPath);
  const seeds = readArrayOption(args, ["seed", "seeds"]);

  if (!targetTitle) {
    throw new Error('Search needs a title, for example: npm start -- search --title "Software Engineer"');
  }

  console.log(`Searching for ${targetTitle}${location ? ` in ${location}` : ""}...`);
  const discovery = await runJobDiscovery({
    targetTitle,
    location,
    maxJobs,
    seeds,
    searchAllSources: readBoolean(args, ["all-sources"], false)
  });

  await writeJobsReport({
    outputPath,
    format,
    jobs: discovery.jobs,
    metadata: {
      mode: "Discovered Jobs",
      targetTitle,
      location,
      requestedJobs: discovery.requestedJobs,
      discovered: discovery.discovered,
      runId: discovery.runId,
      elapsedMs: discovery.elapsedMs,
      sourceReports: discovery.sourceReports
    }
  });

  console.log(`Saved ${discovery.jobs.length} jobs to ${relativeToCwd(outputPath)}.`);
  console.log("The structured index was also updated at data/job-index.json.");
}

async function runListCommand(args) {
  const query = normalizeSearchTitle(readOption(args, ["query", "q", "title", "t"], "") || remainingPositionals(args).join(" "));
  const location = String(readOption(args, ["location", "l"], "") || "").trim();
  const limit = readInteger(args, ["limit", "max", "count", "n"], { min: 1, max: 250, fallback: 50 });
  const activeOnly = readBoolean(args, ["active-only"], true);
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_JOBS_OUTPUT));
  const format = resolveOutputFormat(args, outputPath);

  const jobs = await searchIndexedJobs({ query, location, activeOnly, limit });
  await writeJobsReport({
    outputPath,
    format,
    jobs,
    metadata: {
      mode: "Indexed Jobs",
      targetTitle: query,
      location,
      requestedJobs: limit,
      activeOnly
    }
  });

  console.log(`Saved ${jobs.length} indexed jobs to ${relativeToCwd(outputPath)}.`);
}

async function runTailorCommand(args) {
  const jobId = readOption(args, ["job", "job-id", "id", "url"]);
  const resumePath = readOption(args, ["resume", "resume-file", "r"]);
  const targetTitle = normalizeSearchTitle(readOption(args, ["title", "t"], ""));
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_TAILOR_OUTPUT));

  if (!jobId) throw new Error("Tailoring needs --job with an indexed job id, canonical key, or URL.");
  if (!resumePath) throw new Error("Tailoring needs --resume with a PDF, DOCX, TXT, MD, or RTF resume file.");

  const job = await loadIndexedJob(jobId);
  if (!job) throw new Error(`Could not find an indexed job for ${jobId}. Run a search or list jobs first.`);

  const resumeFile = await readResumeFile(resumePath);
  const extractedResume = await extractResumeInput({ typedText: "", file: resumeFile });
  if (!extractedResume.text || extractedResume.text.length < 80) {
    throw new Error(`Could not read enough resume text from ${resumePath}.`);
  }

  const fallbackTailoring = tailorResumeForJob({
    resumeText: extractedResume.text,
    targetTitle: targetTitle || job.title,
    job
  });
  const tailoring = await tailorResumeWithLlm({
    resumeText: extractedResume.text,
    targetTitle: targetTitle || job.title,
    job,
    fallbackTailoring
  });

  await writeTailoredResumeReport({
    outputPath,
    job,
    tailoring,
    resumeSource: extractedResume.source
  });

  console.log(`Saved tailored resume to ${relativeToCwd(outputPath)}.`);
  console.log(`Tailoring method: ${tailoring.method}${tailoring.model ? ` (${tailoring.model})` : ""}.`);
}

async function runSourcesCommand(args) {
  const sources = jobIndexerSourceCatalogForClient();
  const output = readOption(args, ["output", "o"]);

  if (output) {
    const outputPath = resolveOutputPath(output);
    const lines = [
      "# Job Sources",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...sources.map((source) => [
        `## ${source.name}`,
        "",
        `- Type: ${source.type || "public source"}`,
        `- Mode: ${source.mode || "public fetch"}`,
        `- Status: ${source.status || "available"}`,
        source.description ? `- Description: ${source.description}` : ""
      ].filter(Boolean).join("\n"))
    ];
    await writeTextFile(outputPath, `${lines.join("\n\n")}\n`);
    console.log(`Saved ${sources.length} sources to ${relativeToCwd(outputPath)}.`);
    return;
  }

  for (const source of sources) {
    console.log(`${source.name} - ${source.type || "public source"} - ${source.mode || "public fetch"}`);
  }
}

function runStatusCommand() {
  const llm = getLlmStatus();
  console.log("Resume Job Agent CLI");
  console.log(`LLM tailoring: ${llm.enabled ? `enabled (${llm.model})` : "disabled"}`);
  console.log(`LLM job extraction: ${llm.jobExtractionEnabled ? "enabled" : "disabled"}`);
  console.log("Default jobs output: data/jobs.md");
}

async function writeJobsReport({ outputPath, format, jobs, metadata }) {
  const content = format === "text"
    ? formatJobsAsText(jobs, metadata)
    : formatJobsAsMarkdown(jobs, metadata);
  await writeTextFile(outputPath, content);
}

function formatJobsAsMarkdown(jobs, metadata) {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# Job Results",
    "",
    `Generated: ${generatedAt}`,
    `Mode: ${metadata.mode || "Jobs"}`
  ];

  if (metadata.targetTitle) lines.push(`Search: ${metadata.targetTitle}`);
  if (metadata.location) lines.push(`Location: ${metadata.location}`);
  if (Number.isFinite(metadata.requestedJobs)) lines.push(`Requested: ${metadata.requestedJobs}`);
  if (Number.isFinite(metadata.discovered)) lines.push(`Discovered: ${metadata.discovered}`);
  if (metadata.runId) lines.push(`Run ID: ${metadata.runId}`);
  if (Number.isFinite(metadata.elapsedMs)) lines.push(`Elapsed: ${formatElapsed(metadata.elapsedMs)}`);
  if (metadata.activeOnly !== undefined) lines.push(`Active only: ${metadata.activeOnly ? "yes" : "no"}`);

  lines.push(
    "",
    `Saved jobs: ${jobs.length}`,
    ""
  );

  if (!jobs.length) {
    lines.push("No jobs matched this request.", "");
  }

  jobs.forEach((job, index) => {
    lines.push(`## ${index + 1}. ${cleanLine(job.title || "Untitled role")}`);
    lines.push("");
    lines.push(`- Job ID: ${job.id || "not indexed"}`);
    lines.push(`- Company: ${cleanLine(job.company || "Unknown company")}`);
    lines.push(`- Location: ${cleanLine(job.location || "Unknown location")}`);
    lines.push(`- Posted: ${cleanLine(job.datePosted || job.postedText || "Unknown")}`);
    lines.push(`- Source: ${cleanLine(job.source || job.adapterName || "Unknown source")}`);
    if (Number.isFinite(job.score)) lines.push(`- Score: ${Math.round(job.score)}`);
    if (job.url) lines.push(`- URL: <${job.url}>`);
    const snippet = snippetForJob(job);
    if (snippet) {
      lines.push("");
      lines.push(snippet);
    }
    lines.push("");
  });

  if (metadata.sourceReports?.length) {
    lines.push("## Source Report", "");
    lines.push("| Source | Status | Discovered | Saved |");
    lines.push("| --- | --- | ---: | ---: |");
    for (const report of metadata.sourceReports) {
      lines.push([
        escapeMarkdownCell(report.source || "Unknown"),
        escapeMarkdownCell(report.status || "unknown"),
        Number(report.discovered || 0),
        Number(report.extracted || 0)
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function formatJobsAsText(jobs, metadata) {
  const lines = [
    "JOB RESULTS",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${metadata.mode || "Jobs"}`
  ];

  if (metadata.targetTitle) lines.push(`Search: ${metadata.targetTitle}`);
  if (metadata.location) lines.push(`Location: ${metadata.location}`);
  if (Number.isFinite(metadata.requestedJobs)) lines.push(`Requested: ${metadata.requestedJobs}`);
  if (Number.isFinite(metadata.discovered)) lines.push(`Discovered: ${metadata.discovered}`);
  if (metadata.runId) lines.push(`Run ID: ${metadata.runId}`);
  if (Number.isFinite(metadata.elapsedMs)) lines.push(`Elapsed: ${formatElapsed(metadata.elapsedMs)}`);
  if (metadata.activeOnly !== undefined) lines.push(`Active only: ${metadata.activeOnly ? "yes" : "no"}`);

  lines.push(
    "",
    `Saved jobs: ${jobs.length}`,
    ""
  );

  if (!jobs.length) {
    lines.push("No jobs matched this request.", "");
  }

  jobs.forEach((job, index) => {
    lines.push(`${index + 1}. ${cleanLine(job.title || "Untitled role")}`);
    lines.push(`   Job ID: ${job.id || "not indexed"}`);
    lines.push(`   Company: ${cleanLine(job.company || "Unknown company")}`);
    lines.push(`   Location: ${cleanLine(job.location || "Unknown location")}`);
    lines.push(`   Posted: ${cleanLine(job.datePosted || job.postedText || "Unknown")}`);
    lines.push(`   Source: ${cleanLine(job.source || job.adapterName || "Unknown source")}`);
    if (Number.isFinite(job.score)) lines.push(`   Score: ${Math.round(job.score)}`);
    if (job.url) lines.push(`   URL: ${job.url}`);
    const snippet = snippetForJob(job);
    if (snippet) lines.push(`   Notes: ${snippet}`);
    lines.push("");
  });

  if (metadata.sourceReports?.length) {
    lines.push("SOURCE REPORT");
    for (const report of metadata.sourceReports) {
      lines.push(`- ${report.source || "Unknown"}: ${report.status || "unknown"}, discovered ${Number(report.discovered || 0)}, saved ${Number(report.extracted || 0)}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

async function writeTailoredResumeReport({ outputPath, job, tailoring, resumeSource }) {
  const lines = [
    "# Tailored Resume",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Resume source: ${resumeSource || "resume file"}`,
    `Job: ${job.title || "Untitled role"} at ${job.company || "Unknown company"}`,
  ];

  if (job.url) lines.push(`Job URL: <${job.url}>`);

  lines.push(
    `Method: ${tailoring.method || "deterministic"}${tailoring.model ? ` (${tailoring.model})` : ""}`,
    "",
    tailoring.tailoredResumeMarkdown || "",
    "",
    "## Match Notes",
    "",
    `Matched skills: ${formatInlineList(tailoring.matchedSkills)}`,
    `Transferable keywords: ${formatInlineList(tailoring.transferableKeywords)}`,
    `Missing keywords to verify: ${formatInlineList(tailoring.missingKeywords)}`,
    "",
    "## Cautions",
    "",
    ...(tailoring.cautions || []).map((caution) => `- ${caution}`)
  );

  await writeTextFile(outputPath, `${lines.join("\n").trim()}\n`);
}

async function readResumeFile(resumePath) {
  const absolutePath = path.resolve(process.cwd(), resumePath);
  const buffer = await fs.readFile(absolutePath);
  return {
    originalname: path.basename(absolutePath),
    mimetype: mimeTypeForPath(absolutePath),
    buffer
  };
}

async function writeTextFile(outputPath, content) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf8");
}

function printHelp() {
  console.log(`
Resume Job Agent CLI

Usage:
  npm start -- search --title "Software Engineer" --location "Chicago" --max 25
  npm start -- list --query "Software Engineer" --output data/jobs.txt
  npm start -- tailor --job <job-id-or-url> --resume ./resume.pdf
  npm start -- sources
  npm start -- status

Commands:
  search    Discover jobs, update data/job-index.json, and save a jobs report.
  list      Save matching jobs from the existing local index without searching the web.
  tailor    Create a tailored resume Markdown file for an indexed job.
  sources   Print supported public source categories.
  status    Show local CLI and LLM status.

Common options:
  --title, -t       Target job title.
  --query, -q       Query for indexed jobs.
  --location, -l    Location filter.
  --max, -n         Number of jobs to request.
  --output, -o      Report path. Defaults to data/jobs.md.
  --format          markdown or text. Inferred from .md or .txt when omitted.
`.trim());
}

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("-") || arg === "-") {
      parsed._.push(arg);
      continue;
    }

    if (arg === "--") {
      parsed._.push(...argv.slice(index + 1));
      break;
    }

    const withoutPrefix = arg.replace(/^-+/, "");
    const equalsIndex = withoutPrefix.indexOf("=");
    const rawKey = equalsIndex >= 0 ? withoutPrefix.slice(0, equalsIndex) : withoutPrefix;
    const key = normalizeOptionKey(rawKey);
    let value = equalsIndex >= 0 ? withoutPrefix.slice(equalsIndex + 1) : true;

    if (value === true && argv[index + 1] && !argv[index + 1].startsWith("-")) {
      value = argv[index + 1];
      index += 1;
    }

    setOption(parsed, key, value);
  }

  return parsed;
}

function setOption(parsed, key, value) {
  if (parsed[key] === undefined) {
    parsed[key] = value;
    return;
  }
  parsed[key] = Array.isArray(parsed[key]) ? [...parsed[key], value] : [parsed[key], value];
}

function normalizeOptionKey(key) {
  const aliases = {
    h: "help",
    t: "title",
    q: "query",
    l: "location",
    n: "max",
    o: "output",
    r: "resume"
  };
  return aliases[key] || key.replace(/_/g, "-");
}

function resolveCommand(args) {
  const first = String(args._[0] || "").toLowerCase();
  if (KNOWN_COMMANDS.has(first)) return first;
  if (readOption(args, ["title", "query"])) return "search";
  return "help";
}

function remainingPositionals(args) {
  const first = String(args._[0] || "").toLowerCase();
  return KNOWN_COMMANDS.has(first) ? args._.slice(1) : args._;
}

function readOption(args, keys, fallback = "") {
  for (const key of keys) {
    const normalized = normalizeOptionKey(key);
    const value = args[normalized];
    if (value === undefined) continue;
    return Array.isArray(value) ? value.at(-1) : value;
  }
  return fallback;
}

function readArrayOption(args, keys) {
  return keys
    .flatMap((key) => {
      const value = args[normalizeOptionKey(key)];
      if (value === undefined) return [];
      return Array.isArray(value) ? value : [value];
    })
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

function readInteger(args, keys, { min, max, fallback }) {
  const value = Number(readOption(args, keys, fallback));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function readBoolean(args, keys, fallback) {
  const value = readOption(args, keys, null);
  if (value === null) return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function resolveOutputPath(output) {
  return path.resolve(process.cwd(), String(output || DEFAULT_JOBS_OUTPUT));
}

function resolveOutputFormat(args, outputPath) {
  const requested = String(readOption(args, ["format"], "") || "").toLowerCase();
  if (["text", "txt"].includes(requested)) return "text";
  if (["markdown", "md"].includes(requested)) return "markdown";
  return path.extname(outputPath).toLowerCase() === ".txt" ? "text" : "markdown";
}

function normalizeSearchTitle(value = "") {
  return String(value || "")
    .replace(/\benginner\b/gi, "engineer")
    .replace(/\benginerr\b/gi, "engineer")
    .replace(/\bengeneer\b/gi, "engineer")
    .replace(/\bsofware\b/gi, "software")
    .replace(/\bsoftwear\b/gi, "software")
    .replace(/\bdevelopper\b/gi, "developer")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetForJob(job) {
  return cleanLine(job.excerpt || job.description || job.rawText || "").slice(0, 700);
}

function cleanLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeMarkdownCell(value) {
  return cleanLine(value).replace(/\|/g, "\\|");
}

function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatInlineList(values) {
  return values?.length ? values.join(", ") : "none";
}

function relativeToCwd(filePath) {
  return path.relative(process.cwd(), filePath) || path.basename(filePath);
}

function mimeTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === ".md") return "text/markdown";
  if (extension === ".rtf") return "text/rtf";
  return "text/plain";
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
