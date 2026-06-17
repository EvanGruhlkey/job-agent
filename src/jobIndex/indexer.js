import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { buildJobSourceAdapters } from "./adapters.js";
import { upsertJobs, searchJobDatabase, getIndexedJob } from "./database.js";
import { fetchPageWithFallback } from "./pageFetcher.js";
import { isAdditionalListingSourceAdapter } from "./listingBoardSources.js";
import { FAST_PUBLIC_JOB_SEEDS, MAJOR_JOB_BOARD_SOURCES } from "./sourceDefinitions.js";
import {
  classifyJob,
  cleanText,
  compareJobsByFreshness,
  enrichCompany,
  extractPostedDate,
  matchesQueryIntent,
  normalizeUrl,
  promisePool,
  resolveUrl,
  scoreJobForQuery,
  sha1,
  uniqueBy
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAJOR_BOARD_HTML_DIR = path.join(__dirname, "..", "..", "data", "major-board-html");
const MAJOR_BOARD_SOURCE_NAMES = new Set(MAJOR_JOB_BOARD_SOURCES.map((source) => source.name));

/**
 * @typedef {Object} DiscoverJobsInput
 * @property {string} targetTitle
 * @property {string=} location
 * @property {number=} maxJobs
 * @property {{url:string,name?:string,type?:string}[]=} seeds
 */

export async function runJobDiscovery(input) {
  const startedAt = Date.now();
  const runId = randomUUID();
  const targetTitle = normalizeTargetTitle(input.targetTitle);
  const maxJobs = clamp(input.maxJobs, 1, 500, 100);
  const discoveryInput = {
    ...input,
    targetTitle,
    maxJobs,
    seeds: normalizeSeeds(input.seeds || [])
  };

  const listingPool = await discoverVisibleMajorBoardJobs(discoveryInput, MAJOR_JOB_BOARD_SOURCES);
  const additionalDiscovery = await discoverAdditionalListingJobs(discoveryInput);
  const pool = uniqueBy([...listingPool, ...additionalDiscovery.jobs], resultDedupeKey);
  const jobs = selectRankedJobs(pool, discoveryInput);
  const sourceReports = [
    ...buildMajorBoardSourceReports(pool, jobs, startedAt),
    ...buildAdditionalSourceReports(additionalDiscovery.reports, jobs)
  ];
  const sourceNames = [
    ...MAJOR_JOB_BOARD_SOURCES.map((source) => source.name),
    ...additionalDiscovery.reports.map((report) => report.source)
  ];
  const savedJobs = await upsertJobs(jobs, {
    runId,
    sourceNames,
    searchKey: `${targetTitle || ""}|${input.location || ""}`.toLowerCase()
  });

  return {
    runId,
    jobs: savedJobs,
    sourceReports,
    requestedJobs: maxJobs,
    discovered: pool.length,
    elapsedMs: Date.now() - startedAt,
    pipeline: [
      "Job board search",
      "Listing parser",
      "Ranker",
      "Job database"
    ]
  };
}

async function discoverAdditionalListingJobs(input) {
  const maxJobs = Math.max(1, Number(input.maxJobs) || 25);
  const maxLinksPerSource = Math.min(200, Math.max(24, maxJobs * 2));
  const maxExtractPerSource = Math.min(80, Math.max(12, Math.ceil(maxJobs / 6)));
  const adapters = buildJobSourceAdapters().filter(isAdditionalListingSourceAdapter);

  const results = await promisePool(adapters, 2, async (adapter) => {
    const startedAt = Date.now();
    const failures = [];

    try {
      const links = uniqueBy(
        await adapter.discoverJobs({
          ...input,
          seeds: seedsForAdapter(adapter, input.seeds),
          maxLinks: maxLinksPerSource,
          recentWindowDays: input.recentWindowDays || 14,
          searchAllSources: Boolean(input.searchAllSources)
        }),
        (link) => normalizeUrl(link.url)
      );
      const candidates = prioritizeDiscoveredLinks(links, input).slice(0, maxExtractPerSource);
      const extracted = await promisePool(candidates, 4, async (link) => {
        try {
          const raw = await adapter.extractJob(link.url);
          const normalized = adapter.normalize({
            ...raw,
            input,
            datePosted: raw.datePosted || link.datePosted || "",
            url: raw.url || link.url
          });
          return usableAdditionalJob(normalized, input) ? normalized : null;
        } catch (error) {
          failures.push(`${link.url}: ${error.message}`);
          return null;
        }
      });

      return {
        source: adapter.name,
        type: adapter.type,
        discovered: links.length,
        extracted: extracted.filter(Boolean).length,
        failures: failures.slice(0, 8),
        elapsedMs: Date.now() - startedAt,
        jobs: extracted.filter(Boolean)
      };
    } catch (error) {
      return {
        source: adapter.name,
        type: adapter.type,
        discovered: 0,
        extracted: 0,
        failures: [error.message],
        elapsedMs: Date.now() - startedAt,
        jobs: []
      };
    }
  });

  return {
    jobs: uniqueBy(results.flatMap((result) => result.jobs), resultDedupeKey),
    reports: results.map(({ jobs, ...report }) => report)
  };
}

function seedsForAdapter(adapter, inputSeeds = []) {
  return [...(inputSeeds || []), ...FAST_PUBLIC_JOB_SEEDS]
    .filter((seed) => adapter.canHandle(seed.url || seed));
}

function buildAdditionalSourceReports(reports, jobs) {
  return reports.map((report, index) => ({
    source: report.source,
    label: `Public source ${index + 1}`,
    type: report.type,
    status: report.failures.length && !report.extracted ? "limited" : "ok",
    discovered: report.discovered,
    extracted: jobs.filter((job) => job.source === report.source).length,
    failures: report.failures,
    elapsedMs: report.elapsedMs
  }));
}

function prioritizeDiscoveredLinks(links, input) {
  return [...links].sort((a, b) => {
    const aScore = scoreJobForQuery(linkAsJob(a), input);
    const bScore = scoreJobForQuery(linkAsJob(b), input);
    return bScore - aScore;
  });
}

function linkAsJob(link) {
  return {
    title: link.title || "",
    company: "",
    location: "",
    description: link.snippet || "",
    url: link.url || "",
    datePosted: link.datePosted || ""
  };
}

function usableAdditionalJob(job, input) {
  if (!job?.url || !isUsableListingTitle(job.title) || job.blocked) return false;
  return matchesQueryIntent(job, input);
}

function isUsableListingTitle(title = "") {
  const cleaned = cleanText(title);
  if (!cleaned || cleaned.length < 4 || cleaned.length > 160) return false;
  const lower = cleaned.toLowerCase();
  if (["apply", "view job", "learn more", "see more", "read more", "all jobs", "remote jobs", "search jobs"].includes(lower)) {
    return false;
  }
  return !/^(remote|categories|sign in|login|search|home)$/i.test(cleaned);
}

function buildMajorBoardSourceReports(pool, jobs, startedAt) {
  return MAJOR_JOB_BOARD_SOURCES.map((source, index) => {
    const scraped = pool.filter((job) => job.source === source.name).length;
    const kept = jobs.filter((job) => job.source === source.name).length;
    return {
      source: source.name,
      label: `Listing channel ${index + 1}`,
      type: "major_job_board",
      status: "ok",
      discovered: scraped,
      extracted: kept,
      failures: [],
      elapsedMs: Date.now() - startedAt
    };
  });
}

function selectRankedJobs(candidates, input) {
  const maxJobs = input.maxJobs || 25;
  const sorted = uniqueBy(candidates, resultDedupeKey).sort((a, b) => {
    const intentDelta =
      Number(matchesQueryIntent(b, input)) - Number(matchesQueryIntent(a, input));
    if (intentDelta !== 0) return intentDelta;
    return (b.score || 0) - (a.score || 0) || compareJobsByFreshness(a, b);
  });
  const additionalSourceJobs = sorted.filter((job) => !MAJOR_BOARD_SOURCE_NAMES.has(job.source));
  const additionalTarget = Math.min(additionalSourceJobs.length, Math.ceil(maxJobs * 0.3));
  const reserved = sourceDiverseSlice(additionalSourceJobs, additionalTarget);
  const selected = uniqueBy([...reserved, ...sorted], resultDedupeKey).slice(0, maxJobs);

  return selected.sort((a, b) => {
    const intentDelta =
      Number(matchesQueryIntent(b, input)) - Number(matchesQueryIntent(a, input));
    if (intentDelta !== 0) return intentDelta;
    return (b.score || 0) - (a.score || 0) || compareJobsByFreshness(a, b);
  });
}

function sourceDiverseSlice(jobs, limit) {
  const bySource = new Map();
  for (const job of jobs) {
    const source = job.source || job.adapterName || "Other";
    if (!bySource.has(source)) bySource.set(source, []);
    bySource.get(source).push(job);
  }

  const picked = [];
  while (picked.length < limit && bySource.size) {
    for (const source of [...bySource.keys()]) {
      const group = bySource.get(source);
      const next = group.shift();
      if (next) picked.push(next);
      if (!group.length) bySource.delete(source);
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

async function discoverVisibleMajorBoardJobs(input, sources) {
  const maxJobs = Math.max(1, Number(input.maxJobs) || 25);
  const poolTarget = Math.max(maxJobs, Math.ceil(maxJobs * 1.5));

  const pages = await promisePool(sources, 2, async (source) => {
    const jobsByUrl = new Map();
    const searchUrls = majorBoardSearchUrls(source, input);
    let emptyStreak = 0;

    for (const searchUrl of searchUrls) {
      if (jobsByUrl.size >= poolTarget) break;
      if (emptyStreak >= 2) break;

      try {
        const page = await fetchPageWithFallback(searchUrl, {
          forceBrowser: true,
          browserFallback: true,
          minTextLength: 250,
          timeoutMs: 22000,
          attempts: 1,
          scrollToBottom: true,
          scrollRounds: source.id === "linkedin"
            ? Math.min(24, 6 + Math.ceil(maxJobs / 20))
            : Math.min(20, 5 + Math.ceil(maxJobs / 15)),
          scrollDelayMs: 700
        });
        if (page.blocked && !(page.html || "").length) {
          emptyStreak += 1;
          continue;
        }

        const before = jobsByUrl.size;
        const visibleJobs = source.id === "linkedin"
          ? extractLinkedInVisibleJobs(page.html || "", page.url || searchUrl, source, input)
          : extractIndeedVisibleJobs(page.html || "", page.url || searchUrl, source, input);
        const snapshotPath = await saveMajorBoardListingHtml(page, source, input, visibleJobs);
        for (const job of visibleJobs) {
          jobsByUrl.set(normalizeUrl(job.url), {
            ...job,
            majorBoardSnapshotPath: snapshotPath,
            rawText: [job.rawText, snapshotPath ? `HTML snapshot: ${snapshotPath}` : ""].filter(Boolean).join("\n\n")
          });
        }
        emptyStreak = jobsByUrl.size === before ? emptyStreak + 1 : 0;
      } catch {
        emptyStreak += 1;
      }
    }
    return [...jobsByUrl.values()];
  });
  return uniqueBy(pages.flat(), (job) => normalizeUrl(job.url));
}

function majorBoardSearchUrls(source, input) {
  const requested = Math.max(1, Number(input.maxJobs) || 25);
  const pageSize = source.id === "linkedin" ? 25 : 15;
  const maxPages = source.id === "linkedin"
    ? Math.min(40, Math.max(4, Math.ceil(requested / pageSize) + 4))
    : Math.min(40, Math.max(4, Math.ceil(requested / pageSize) + 4));
  const urls = [];

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const parsed = new URL(source.searchUrl(input));
    const offset = pageIndex * pageSize;
    if (source.id === "linkedin") parsed.searchParams.set("start", String(offset));
    if (source.id === "indeed") parsed.searchParams.set("start", String(offset));
    urls.push(parsed.toString());
  }

  return urls;
}

async function saveMajorBoardListingHtml(page, source, input, jobs) {
  await fs.mkdir(MAJOR_BOARD_HTML_DIR, { recursive: true });
  const sourceSlug = source.id || source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const titleSlug = normalizeTargetTitle(input.targetTitle).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "jobs";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const urlHash = sha1(page.url || source.searchUrl(input)).slice(0, 10);
  const filePath = path.join(MAJOR_BOARD_HTML_DIR, `${stamp}-${sourceSlug}-${titleSlug}-${urlHash}.html`);
  const header = [
    `<!--`,
    `Source: ${source.name}`,
    `Search URL: ${page.url || source.searchUrl(input)}`,
    `Target title: ${input.targetTitle}`,
    `Location: ${input.location || "United States"}`,
    `Visible jobs parsed: ${jobs.length}`,
    `Captured at: ${new Date().toISOString()}`,
    `-->`,
    ""
  ].join("\n");
  await fs.writeFile(filePath, `${header}${page.html || ""}`, "utf8");
  return filePath;
}

function extractLinkedInVisibleJobs(html, pageUrl, source, input) {
  const $ = cheerio.load(html || "");
  const jobs = [];

  $(".base-card, .job-search-card, li[data-entity-urn]").each((index, element) => {
    const card = $(element);
    const link = firstAttr(card, [
      "a.base-card__full-link",
      "a[href*='/jobs/view/']",
      "a[href]"
    ], "href");
    const url = normalizeUrl(resolveUrl(link, pageUrl));
    if (!url) return;

    const title = firstText(card, [
      ".base-search-card__title",
      ".job-search-card__title",
      "h3",
      "a[href*='/jobs/view/']"
    ]);
    const company = firstText(card, [
      ".base-search-card__subtitle",
      ".job-search-card__subtitle",
      "h4"
    ]) || source.name;
    const location = firstText(card, [
      ".job-search-card__location",
      "[class*='location']"
    ]) || input.location || "United States";
    const postedText = firstText(card, ["time", ".job-search-card__listdate", "[class*='listdate']"]);
    const datePosted = firstAttr(card, ["time"], "datetime") || extractPostedDate(postedText);
    const snippet = cleanText(card.text()).replace(/\s+/g, " ").slice(0, 700);

    jobs.push(visibleBoardJobFromCard(source, {
      title,
      company,
      location,
      datePosted,
      postedText,
      snippet,
      url
    }, input, index));
  });

  return jobs.filter((job) => job.title && job.url);
}

function extractIndeedVisibleJobs(html, pageUrl, source, input) {
  const $ = cheerio.load(html || "");
  const jobs = [];

  $(".cardOutline, .job_seen_beacon, [data-jk]").each((index, element) => {
    const card = $(element);
    const linkNode = card.find("a[data-jk], a[id^='job_'], a[href*='viewjob'], a[href*='/rc/clk']").first();
    const jobKey = linkNode.attr("data-jk") || card.attr("data-jk") || linkNode.attr("id")?.replace(/^job_/, "");
    const rawHref = linkNode.attr("href");
    const url = normalizeUrl(jobKey
      ? `https://www.indeed.com/viewjob?jk=${encodeURIComponent(jobKey)}`
      : resolveUrl(rawHref, pageUrl));
    if (!url) return;

    const title = firstText(card, [
      "[id^='jobTitle-']",
      ".jobTitle span[title]",
      ".jobTitle",
      "h2",
      "h3"
    ]);
    const company = firstText(card, ["[data-testid='company-name']", "[class*='companyName']", "[class*='company-name']"]) || source.name;
    const location = firstText(card, ["[data-testid='text-location']", "[class*='companyLocation']", "[class*='location']"]) || input.location || "United States";
    const postedText = firstText(card, [
      "[data-testid='myJobsStateDate']",
      "[class*='date']",
      "[class*='jobMetaDataGroup']"
    ]);
    const snippet = cleanText(card.text()).replace(/\s+/g, " ").slice(0, 700);
    const datePosted = extractPostedDate(`${postedText} ${snippet}`);

    jobs.push(visibleBoardJobFromCard(source, {
      title,
      company,
      location,
      datePosted,
      postedText,
      snippet,
      url
    }, input, index));
  });

  return uniqueBy(jobs.filter((job) => job.title && job.url), (job) => normalizeUrl(job.url));
}

function visibleBoardJobFromCard(source, card, input, index) {
  const datePosted =
    card.datePosted ||
    extractPostedDate(`${card.postedText || ""} ${card.snippet || ""}`) ||
    new Date().toISOString().slice(0, 10);
  const description = [
    `Public listing for ${input.targetTitle}.`,
    `Company: ${cleanText(card.company || source.name) || source.name}`,
    `Location: ${cleanText(card.location || input.location || "United States") || "United States"}`,
    `Posted: ${datePosted}`,
    card.snippet ? `Listing text: ${card.snippet}` : ""
  ].filter(Boolean).join("\n\n");

  const job = {
    title: cleanText(card.title || "").slice(0, 160),
    company: cleanText(card.company || source.name).slice(0, 100) || source.name,
    location: cleanText(card.location || input.location || "United States").slice(0, 160),
    datePosted,
    description,
    excerpt: card.snippet || source.reason,
    url: normalizeUrl(card.url),
    source: source.name,
    adapterName: `${source.name} visible listings`,
    sourceType: "major_job_board",
    rawText: description,
    blocked: false,
    rendered: true,
    screenshotPath: "",
    extractionErrors: [],
    handoff: null
  };
  job.score = scoreJobForQuery(job, input) + Math.max(0, 20 - index);
  job.classification = classifyJob(job);
  job.companyEnrichment = enrichCompany(job);
  return job;
}

function firstText(root, selectors) {
  for (const selector of selectors) {
    const text = cleanText(root.find(selector).first().text());
    if (text) return text;
  }
  return "";
}

function firstAttr(root, selectors, attr) {
  for (const selector of selectors) {
    const value = root.find(selector).first().attr(attr);
    if (value) return value;
  }
  return "";
}

export async function searchIndexedJobs(input = {}) {
  return searchJobDatabase(input);
}

export async function loadIndexedJob(id) {
  return getIndexedJob(id);
}

function normalizeSeeds(seeds) {
  return seeds
    .map((seed) => typeof seed === "string" ? { url: seed } : seed)
    .filter((seed) => /^https?:\/\//i.test(seed?.url || ""));
}

function normalizeTargetTitle(title = "") {
  return String(title || "")
    .replace(/\benginner\b/gi, "engineer")
    .replace(/\benginerr\b/gi, "engineer")
    .replace(/\bengeneer\b/gi, "engineer")
    .replace(/\bsofware\b/gi, "software")
    .replace(/\bsoftwear\b/gi, "software")
    .replace(/\bdevelopper\b/gi, "developer")
    .replace(/\s+/g, " ")
    .trim();
}

function resultDedupeKey(job) {
  const company = cleanText(job.company || "").toLowerCase();
  const title = cleanText(job.title || "").toLowerCase();
  const location = cleanText(job.location || "").toLowerCase();
  if (company && title) return `${company}|${title}|${location}`;
  return normalizeUrl(job.url || "").toLowerCase();
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}
