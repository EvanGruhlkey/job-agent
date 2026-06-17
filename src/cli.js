import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runJobDiscovery, searchIndexedJobs } from "./jobIndex/indexer.js";
import { loadJobDatabase } from "./jobIndex/database.js";

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_JOBS_OUTPUT = path.join("data", "jobs.md");
const DEFAULT_FEED_OUTPUT = path.join("data", "job-feed.md");
const DEFAULT_MAX_JOBS = 100;
const MAX_JOBS_LIMIT = 500;
const DEFAULT_FRESH_DAYS = 14;
const COMMAND_ALIASES = new Map([
  ["find", "search"],
  ["discover", "search"],
  ["fresh", "feed"],
  ["radar", "feed"],
  ["jobs", "list"]
]);
const KNOWN_COMMANDS = new Set(["search", "feed", "list", "categories", "help", ...COMMAND_ALIASES.keys()]);
const CATEGORY_PRESETS = new Map([
  ["software", "Software Engineer"],
  ["swe", "Software Engineer"],
  ["engineering", "Software Engineer"],
  ["data", "Data Analyst"],
  ["analytics", "Data Analyst"],
  ["ai", "Machine Learning Engineer"],
  ["ml", "Machine Learning Engineer"],
  ["product", "Product Manager"],
  ["design", "Product Designer"],
  ["finance", "Financial Analyst"],
  ["accounting", "Accountant"],
  ["marketing", "Marketing Manager"],
  ["sales", "Account Executive"],
  ["cybersecurity", "Cybersecurity Analyst"],
  ["security", "Cybersecurity Analyst"],
  ["consulting", "Consultant"],
  ["legal", "Paralegal"],
  ["hr", "Human Resources Generalist"],
  ["healthcare", "Registered Nurse"],
  ["education", "Teacher"],
  ["supply", "Supply Chain Analyst"],
  ["operations", "Operations Manager"],
  ["customer", "Customer Support Specialist"]
]);

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = resolveCommand(args);

  if (readFlag(args, ["help", "h"]) || command === "help") {
    printHelp();
    return;
  }

  switch (command) {
    case "search":
      await runSearchCommand(args);
      return;
    case "feed":
      await runFeedCommand(args);
      return;
    case "list":
      await runListCommand(args);
      return;
    case "categories":
      printCategories();
      return;
    default:
      printHelp();
  }
}

async function runSearchCommand(args) {
  const targetTitle = readTargetTitle(args);
  const location = String(readOption(args, ["location", "l"], "") || "").trim();
  const quickOpenCount = readOptionalInteger(args, ["how-many", "howmany", "how"]);
  const maxJobs = quickOpenCount || readInteger(args, ["max", "count", "limit", "n"], {
    min: 1,
    max: MAX_JOBS_LIMIT,
    fallback: DEFAULT_MAX_JOBS
  });
  const recentWindowDays = readInteger(args, ["fresh-days", "days", "recent"], {
    min: 1,
    max: 90,
    fallback: DEFAULT_FRESH_DAYS
  });
  const searchAllSources = readFlag(args, ["all-sources", "all"]);
  const shouldOpenJobs = Boolean(quickOpenCount) || readFlag(args, ["open"]);
  const shouldWriteReport = !quickOpenCount && !readFlag(args, ["no-write", "no-report"]);
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_JOBS_OUTPUT));
  const format = resolveOutputFormat(outputPath);

  if (!targetTitle) {
    throw new Error('Search needs a job title, for example: npm start -- search "Software Engineer"');
  }

  console.log(`Searching for ${targetTitle}${location ? ` in ${location}` : ""} (up to ${maxJobs} jobs)...`);
  if (quickOpenCount) {
    console.log("Quick-open mode: opening links when the first results are ready; no report will be written.");
  }
  let discovery = await runJobDiscovery({
    targetTitle,
    location,
    maxJobs,
    recentWindowDays,
    searchAllSources,
    fastMode: Boolean(quickOpenCount)
  });
  let fallbackNote = "";

  if (!discovery.jobs.length && location) {
    console.log("No matches found with that location. Trying the same search without the location filter...");
    discovery = await runJobDiscovery({ targetTitle, maxJobs, recentWindowDays, searchAllSources, fastMode: Boolean(quickOpenCount) });
    fallbackNote = `No matches were found for ${location}, so this report uses broader matches.`;
  }

  if (!discovery.jobs.length) {
    const indexedFallback = await searchIndexedJobs({ query: targetTitle, location, activeOnly: true, limit: maxJobs });
    if (indexedFallback.length) {
      discovery = {
        ...discovery,
        jobs: indexedFallback,
        discovered: indexedFallback.length,
        sourceReports: [
          ...(discovery.sourceReports || []),
          {
            source: "Local index",
            status: "fallback",
            discovered: indexedFallback.length,
            extracted: indexedFallback.length
          }
        ]
      };
      fallbackNote = "Live discovery returned no jobs, so this report uses matching jobs from the local index.";
    }
  }

  if (shouldWriteReport) {
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
        sourceReports: discovery.sourceReports,
        fallbackNote,
        recentWindowDays,
        searchAllSources
      }
    });
    console.log(`Saved ${discovery.jobs.length} jobs to ${relativeToCwd(outputPath)}.`);
  }

  if (shouldOpenJobs) {
    const opened = await openJobLinks(discovery.jobs);
    console.log(`Opened ${opened} job link${opened === 1 ? "" : "s"}.`);
  }

  console.log("The structured index was also updated at data/job-index.json.");
}

async function runFeedCommand(args) {
  const targetTitle = readTargetTitle(args);
  const location = String(readOption(args, ["location", "l"], "United States") || "").trim();
  const maxJobs = readInteger(args, ["max", "count", "limit", "n"], {
    min: 1,
    max: MAX_JOBS_LIMIT,
    fallback: DEFAULT_MAX_JOBS
  });
  const recentWindowDays = readInteger(args, ["fresh-days", "days", "recent"], {
    min: 1,
    max: 90,
    fallback: 7
  });
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_FEED_OUTPUT));
  const format = resolveOutputFormat(outputPath);
  const fastMode = readFlag(args, ["fast"]);
  const searchAllSources = !fastMode && readFlag(args, ["all-sources", "all"], true);

  if (!targetTitle) {
    throw new Error('Feed needs a role or category, for example: npm start -- feed --category software --location "Remote"');
  }

  const before = await loadJobDatabase();
  const previousActiveIds = new Set((before.jobs || []).filter((job) => job.active).map((job) => job.id));

  console.log(`Building fresh feed for ${targetTitle}${location ? ` in ${location}` : ""} (${recentWindowDays}-day window, up to ${maxJobs} jobs)...`);
  const discovery = await runJobDiscovery({
    targetTitle,
    location,
    maxJobs,
    recentWindowDays,
    searchAllSources,
    fastMode
  });
  const after = await loadJobDatabase();
  const feed = buildFreshFeed({
    jobs: discovery.jobs,
    database: after,
    previousActiveIds,
    recentWindowDays,
    targetTitle,
    location,
    maxJobs,
    sourceReports: discovery.sourceReports,
    runId: discovery.runId,
    elapsedMs: discovery.elapsedMs,
    searchAllSources
  });

  await writeJobsReport({
    outputPath,
    format,
    jobs: feed.jobs,
    metadata: feed.metadata
  });

  console.log(`Saved ${feed.jobs.length} fresh jobs to ${relativeToCwd(outputPath)}.`);
  console.log(`New active jobs since the prior index: ${feed.metadata.newSincePreviousIndex}. Active total: ${feed.metadata.activeTotal}.`);
}

async function runListCommand(args) {
  const query = readTargetTitle(args);
  const location = String(readOption(args, ["location", "l"], "") || "").trim();
  const limit = readInteger(args, ["limit", "max", "count", "n"], {
    min: 1,
    max: MAX_JOBS_LIMIT,
    fallback: DEFAULT_MAX_JOBS
  });
  const outputPath = resolveOutputPath(readOption(args, ["output", "o"], DEFAULT_JOBS_OUTPUT));
  const format = resolveOutputFormat(outputPath);

  const jobs = await searchIndexedJobs({ query, location, activeOnly: true, limit });
  await writeJobsReport({
    outputPath,
    format,
    jobs,
    metadata: {
      mode: "Indexed Jobs",
      targetTitle: query,
      location,
      requestedJobs: limit,
      activeOnly: true
    }
  });

  console.log(`Saved ${jobs.length} indexed jobs to ${relativeToCwd(outputPath)}.`);
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
  if (metadata.fallbackNote) lines.push(`Note: ${metadata.fallbackNote}`);
  if (Number.isFinite(metadata.recentWindowDays)) lines.push(`Freshness window: ${metadata.recentWindowDays} days`);
  if (metadata.searchAllSources !== undefined) lines.push(`All-source discovery: ${metadata.searchAllSources ? "yes" : "no"}`);
  if (Number.isFinite(metadata.newToday)) lines.push(`New openings today: ${metadata.newToday}`);
  if (Number.isFinite(metadata.newSincePreviousIndex)) lines.push(`New since previous index: ${metadata.newSincePreviousIndex}`);
  if (Number.isFinite(metadata.activeTotal)) lines.push(`Active openings in index: ${metadata.activeTotal}`);
  if (metadata.lastUpdated) lines.push(`Last updated: ${metadata.lastUpdated}`);

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
    if (job.firstSeen) lines.push(`- First seen: ${cleanLine(job.firstSeen).slice(0, 10)}`);
    if (job.lastSeen) lines.push(`- Last verified: ${cleanLine(job.lastSeen).slice(0, 10)}`);
    lines.push(`- Source: ${cleanLine(job.source || job.adapterName || "Unknown source")}`);
    if (job.freshnessLabel) lines.push(`- Freshness: ${job.freshnessLabel}`);
    if (job.fitReason) lines.push(`- Why matched: ${cleanLine(job.fitReason)}`);
    if (Number.isFinite(job.score)) lines.push(`- Score: ${Math.round(job.score)}`);
    if (job.url) lines.push(`- URL: <${job.url}>`);
    const snippet = snippetForJob(job);
    if (snippet) {
      lines.push("");
      lines.push(snippet);
    }
    lines.push("");
  });

  if (metadata.categorySummary?.length) {
    lines.push("## Category Summary", "");
    lines.push("| Category | Jobs |");
    lines.push("| --- | ---: |");
    for (const item of metadata.categorySummary) {
      lines.push(`| ${escapeMarkdownCell(item.category)} | ${item.count} |`);
    }
    lines.push("");
  }

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
  if (metadata.fallbackNote) lines.push(`Note: ${metadata.fallbackNote}`);
  if (Number.isFinite(metadata.recentWindowDays)) lines.push(`Freshness window: ${metadata.recentWindowDays} days`);
  if (metadata.searchAllSources !== undefined) lines.push(`All-source discovery: ${metadata.searchAllSources ? "yes" : "no"}`);
  if (Number.isFinite(metadata.newToday)) lines.push(`New openings today: ${metadata.newToday}`);
  if (Number.isFinite(metadata.newSincePreviousIndex)) lines.push(`New since previous index: ${metadata.newSincePreviousIndex}`);
  if (Number.isFinite(metadata.activeTotal)) lines.push(`Active openings in index: ${metadata.activeTotal}`);
  if (metadata.lastUpdated) lines.push(`Last updated: ${metadata.lastUpdated}`);

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
    if (job.firstSeen) lines.push(`   First seen: ${cleanLine(job.firstSeen).slice(0, 10)}`);
    if (job.lastSeen) lines.push(`   Last verified: ${cleanLine(job.lastSeen).slice(0, 10)}`);
    lines.push(`   Source: ${cleanLine(job.source || job.adapterName || "Unknown source")}`);
    if (job.freshnessLabel) lines.push(`   Freshness: ${job.freshnessLabel}`);
    if (job.fitReason) lines.push(`   Why matched: ${cleanLine(job.fitReason)}`);
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

  if (metadata.categorySummary?.length) {
    lines.push("CATEGORY SUMMARY");
    for (const item of metadata.categorySummary) {
      lines.push(`- ${item.category}: ${item.count}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

async function writeTextFile(outputPath, content) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf8");
}

function printHelp() {
  console.log(`
Job Search Agent CLI

Usage:
  npm start -- search "Software Engineer" --how-many 5
  npm start -- search "Software Engineer" --location "Remote" --max 200
  npm start -- feed --category software --location "United States" --fresh-days 7 --max 200
  npm start -- list "Software Engineer"
  npm start -- categories

Commands:
  search    Discover jobs. Use --how-many to open links, or --max to save a report.
  feed      Intern List-style fresh feed: all-source discovery, freshness stats, source summary, and category counts.
  list      Save matching jobs from the existing local index without searching the web again.
  categories Show role category shortcuts for feed/search.

Options:
  --location    Optional location filter.
  --how-many    Search for this many jobs, open each link, and skip writing a report.
  --open        Open result links after searching.
  --no-write    Skip writing data/jobs.md.
  --category    Role shortcut, e.g. software, data, product, design, finance, marketing.
  --fresh-days  Freshness window for live discovery. Defaults to ${DEFAULT_FRESH_DAYS} for search, 7 for feed.
  --all-sources Search the broader source catalog. Feed enables this by default; use --fast to disable.
  --max         Number of jobs to find (default ${DEFAULT_MAX_JOBS}, max ${MAX_JOBS_LIMIT}).
  --output      Report path. Defaults to data/jobs.md.
`.trim());
}

function printCategories() {
  console.log("Role category shortcuts:");
  for (const [key, title] of CATEGORY_PRESETS) {
    console.log(`  ${key.padEnd(14)} ${title}`);
  }
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
    c: "category",
    l: "location",
    n: "max",
    o: "output"
  };
  return aliases[key] || key.replace(/_/g, "-");
}

function resolveCommand(args) {
  const first = String(args._[0] || "").toLowerCase();
  if (COMMAND_ALIASES.has(first)) return COMMAND_ALIASES.get(first);
  if (KNOWN_COMMANDS.has(first)) return first;
  if (readOption(args, ["title", "query"])) return "search";
  if (args._.length) return "search";
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

function readSimpleSearchText(args) {
  const optionText = readOption(args, ["title", "t", "query", "q"], "");
  const positionalText = remainingPositionals(args).join(" ");
  return normalizeSearchTitle([optionText, positionalText].filter(Boolean).join(" "));
}

function readFlag(args, keys, fallback = false) {
  const value = readOption(args, keys, fallback);
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function readInteger(args, keys, { min, max, fallback }) {
  const value = Number(readOption(args, keys, fallback));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function readOptionalInteger(args, keys) {
  for (const key of keys) {
    const value = readOption(args, [key], undefined);
    if (value === undefined || value === true) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return Math.min(MAX_JOBS_LIMIT, Math.max(1, Math.round(number)));
  }
  return 0;
}

function resolveOutputPath(output) {
  return path.resolve(process.cwd(), String(output || DEFAULT_JOBS_OUTPUT));
}

function resolveOutputFormat(outputPath) {
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

function readTargetTitle(args) {
  const category = String(readOption(args, ["category", "c"], "") || "").trim().toLowerCase();
  const categoryTitle = CATEGORY_PRESETS.get(category) || "";
  const explicitTitle = readSimpleSearchText(args);
  return normalizeSearchTitle(explicitTitle || categoryTitle);
}

function buildFreshFeed({
  jobs,
  database,
  previousActiveIds,
  recentWindowDays,
  targetTitle,
  location,
  maxJobs,
  sourceReports,
  runId,
  elapsedMs,
  searchAllSources
}) {
  const today = new Date().toISOString().slice(0, 10);
  const activeJobs = (database.jobs || []).filter((job) => job.active);
  const matchingActive = activeJobs.filter((job) => !targetTitle || job.searchKeys?.some((key) => key.includes(targetTitle.toLowerCase())));
  const freshJobs = jobs
    .map((job) => ({
      ...job,
      freshnessLabel: freshnessLabel(job, today),
      fitReason: fitReason(job, targetTitle, location)
    }))
    .sort((a, b) => freshnessRank(b) - freshnessRank(a) || (b.score || 0) - (a.score || 0))
    .slice(0, maxJobs);

  const newToday = activeJobs.filter((job) => String(job.firstSeen || "").startsWith(today)).length;
  const newSincePreviousIndex = activeJobs.filter((job) => !previousActiveIds.has(job.id)).length;
  const categorySummary = summarizeCategories(freshJobs);
  const lastRun = (database.runs || []).at(-1);

  return {
    jobs: freshJobs,
    metadata: {
      mode: "Fresh Job Feed",
      targetTitle,
      location,
      requestedJobs: maxJobs,
      discovered: jobs.length,
      runId,
      elapsedMs,
      sourceReports,
      recentWindowDays,
      searchAllSources,
      newToday,
      newSincePreviousIndex,
      activeTotal: activeJobs.length,
      matchingActiveTotal: matchingActive.length,
      lastUpdated: lastRun?.at || "",
      categorySummary
    }
  };
}

function freshnessLabel(job, today) {
  const firstSeen = String(job.firstSeen || "").slice(0, 10);
  const lastSeen = String(job.lastSeen || "").slice(0, 10);
  const posted = String(job.datePosted || "").slice(0, 10);
  if (firstSeen === today) return "new today";
  if (posted === today) return "posted today";
  if (lastSeen === today) return "verified today";
  if (posted) return `posted ${posted}`;
  return "freshness unknown";
}

function freshnessRank(job) {
  const today = new Date().toISOString().slice(0, 10);
  if (String(job.firstSeen || "").startsWith(today)) return 5;
  if (String(job.datePosted || "").startsWith(today)) return 4;
  if (String(job.lastSeen || "").startsWith(today)) return 3;
  if (job.datePosted) return 2;
  return 1;
}

function fitReason(job, targetTitle, location) {
  const reasons = [];
  if (targetTitle && cleanLine(job.title).toLowerCase().includes(targetTitle.toLowerCase().split(/\s+/)[0])) {
    reasons.push("title match");
  }
  if (location && cleanLine(`${job.location} ${job.description}`).toLowerCase().includes(location.toLowerCase().split(/\s+/)[0])) {
    reasons.push("location match");
  }
  if (/greenhouse|lever|ashby|workday|smartrecruiters|workable/i.test(job.url || "")) {
    reasons.push("direct ATS/company apply");
  }
  if (job.datePosted) reasons.push("has posted date");
  return reasons.join(", ") || "ranked by source freshness and query relevance";
}

function summarizeCategories(jobs) {
  const counts = new Map();
  for (const job of jobs) {
    for (const category of job.classification || ["general"]) {
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  }
  return [...counts]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
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

function relativeToCwd(filePath) {
  return path.relative(process.cwd(), filePath) || path.basename(filePath);
}

async function openJobLinks(jobs) {
  const urls = jobs.map((job) => job.url).filter(Boolean);
  let opened = 0;
  for (const url of urls) {
    const ok = await openUrl(url);
    if (ok) opened += 1;
    else console.warn(`Could not open: ${url}`);
  }
  return opened;
}

function openUrl(url) {
  const command = process.platform === "win32"
    ? "powershell.exe"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const args = process.platform === "win32"
    ? ["-NoProfile", "-NonInteractive", "-Command", `Start-Process -FilePath '${escapePowerShellSingleQuoted(url)}'`]
    : [url];

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "ignore",
      windowsHide: true
    });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

function escapePowerShellSingleQuoted(value) {
  return String(value).replace(/'/g, "''");
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  });
}
