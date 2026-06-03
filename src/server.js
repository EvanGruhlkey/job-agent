import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractResumeInput } from "./resumeParser.js";
import { tailorResumeForJob } from "./tailor.js";
import { getLlmStatus, tailorResumeWithLlm } from "./llm.js";
import { loadIndexedJob, runJobDiscovery, searchIndexedJobs } from "./jobIndex/indexer.js";
import { jobIndexerSourceCatalogForClient } from "./jobIndex/adapters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: getLlmStatus() });
});

app.get("/api/sources", (_req, res) => {
  res.json({ sources: jobIndexerSourceCatalogForClient() });
});

app.get("/api/index/jobs", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const location = String(req.query.location || "").trim();
    const activeOnly = parseBoolean(req.query.activeOnly, true);
    const limit = clampNumber(req.query.limit, 1, 250, 50);
    res.json({
      jobs: await searchIndexedJobs({ query, location, activeOnly, limit }),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Could not search the job index.", detail: error.message });
  }
});

app.post("/api/index/discover", async (req, res) => {
  try {
    const targetTitle = normalizeSearchTitle(req.body.targetTitle);
    const location = String(req.body.location || "").trim();
    const maxJobs = clampNumber(req.body.maxJobs, 1, 250, 25);
    const seeds = Array.isArray(req.body.seeds) ? req.body.seeds : [];

    if (!targetTitle) {
      return res.status(400).json({ error: "Enter the job title to index." });
    }

    const discovery = await runJobDiscovery({
      targetTitle,
      location,
      maxJobs,
      seeds
    });

    res.json({ ...discovery, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Job discovery failed.", detail: error.message });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const targetTitle = normalizeSearchTitle(req.body.targetTitle);
    const location = String(req.body.location || "").trim();
    const maxJobs = clampNumber(req.body.maxJobs, 1, 200, 25);

    if (!targetTitle) {
      return res.status(400).json({ error: "Enter the job title you want." });
    }

    const search = await runJobDiscovery({
      targetTitle,
      location,
      maxJobs
    });

    res.json({
      targetTitle,
      location,
      requestedJobs: maxJobs,
      jobs: search.jobs,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "The search failed. Try again with a narrower title or location.",
      detail: error.message
    });
  }
});

app.post("/api/index/jobs/:id/tailor", upload.single("resumeFile"), async (req, res) => {
  try {
    const resumeText = String(req.body.resumeText || "").trim();
    const targetTitle = normalizeSearchTitle(req.body.targetTitle);
    const extractedResume = await extractResumeInput({
      typedText: resumeText,
      file: req.file
    });
    const job = await loadIndexedJob(req.params.id);

    if (!job) return res.status(404).json({ error: "Indexed job not found." });
    if (!extractedResume.text || extractedResume.text.length < 80) {
      return res.status(400).json({ error: "Add a longer resume by pasting text or uploading a supported file." });
    }

    const fallbackTailoring = tailorResumeForJob({
      resumeText: extractedResume.text,
      targetTitle: targetTitle || job.title,
      job
    });

    res.json({
      job,
      tailoring: await tailorResumeWithLlm({
        resumeText: extractedResume.text,
        targetTitle: targetTitle || job.title,
        job,
        fallbackTailoring
      })
    });
  } catch (error) {
    res.status(500).json({ error: "Could not tailor the indexed job.", detail: error.message });
  }
});

app.post("/api/tailor", express.json({ limit: "4mb" }), async (req, res) => {
  try {
    const resumeText = String(req.body.resumeText || "").trim();
    const targetTitle = String(req.body.targetTitle || "").trim();
    const job = req.body.job;

    if (!resumeText || !targetTitle || !job?.description) {
      return res.status(400).json({ error: "Resume text, target title, and job description are required." });
    }

    const jobForTailoring = { ...job, sourceType: "manual" };
    const fallbackTailoring = tailorResumeForJob({ resumeText, targetTitle, job: jobForTailoring });

    res.json({
      tailoring: await tailorResumeWithLlm({
        resumeText,
        targetTitle,
        job: jobForTailoring,
        fallbackTailoring
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Resume Job Agent running on http://localhost:${port}`);
});

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "on", "yes"].includes(String(value).toLowerCase());
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
