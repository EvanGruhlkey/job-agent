const form = document.querySelector("#searchForm");
const statusStrip = document.querySelector("#statusStrip");
const statusDot = document.querySelector(".status-dot");
const jobsList = document.querySelector("#jobsList");
const jobCount = document.querySelector("#jobCount");
const jobDetail = document.querySelector("#jobDetail");
const jobLink = document.querySelector("#jobLink");

let currentJobs = [];
let selectedJob = null;

loadImportRunFromUrl();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearResults();

  const requestedJobs = Number(form.maxJobs.value) || 25;
  setBusy(true, `Searching for up to ${requestedJobs} job matches...`);

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetTitle: form.targetTitle.value.trim(),
        location: form.location.value.trim(),
        maxJobs: requestedJobs
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Search failed.");
    }

    currentJobs = payload.jobs || [];
    renderJobs(currentJobs);

    if (currentJobs.length) {
      selectJob(currentJobs[0].url);
      const requested = payload.requestedJobs || requestedJobs;
      const statusMessage = currentJobs.length >= requested
        ? `Found ${currentJobs.length} matches for ${payload.targetTitle}.`
        : `Found ${currentJobs.length} of ${requested} requested for ${payload.targetTitle}.`;
      setBusy(false, statusMessage);
    } else {
      setBusy(false, "No matches found. Try a broader title or location.");
    }
  } catch (error) {
    setBusy(false, error.message, true);
  }
});

async function loadImportRunFromUrl() {
  const runId = new URLSearchParams(window.location.search).get("importRun");
  if (!runId) return;

  clearResults();
  setBusy(true, "Loading imported jobs...");

  try {
    const response = await fetch(`/api/import/runs/${encodeURIComponent(runId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load imported jobs.");

    currentJobs = payload.jobs || [];
    renderJobs(currentJobs);
    if (currentJobs.length) {
      selectJob(currentJobs[0].url);
      setBusy(false, `Loaded ${currentJobs.length} imported jobs.`);
    } else {
      setBusy(false, "The import run did not include any jobs.", true);
    }
  } catch (error) {
    setBusy(false, error.message, true);
  }
}

function renderJobs(jobs) {
  jobCount.textContent = `${jobs.length} found`;

  if (!jobs.length) {
    jobsList.className = "jobs-list empty-state";
    jobsList.textContent = "No matches yet.";
    return;
  }

  jobsList.className = "jobs-list";
  jobsList.innerHTML = jobs
    .map(
      (job) => `
        <button class="job-card" type="button" data-url="${escapeAttr(job.url)}">
          <h3>${escapeHtml(job.title)}</h3>
          <div class="job-meta">
            <span>${escapeHtml(job.company)}</span>
            <span>${escapeHtml(job.location)}</span>
            <span>${escapeHtml(formatPostedDate(job.datePosted))}</span>
          </div>
          <div class="job-meta">
            <span class="badge">score ${job.score ?? 0}</span>
          </div>
        </button>
      `
    )
    .join("");

  jobsList.querySelectorAll(".job-card").forEach((button) => {
    button.addEventListener("click", () => selectJob(button.dataset.url));
  });
}

function selectJob(url) {
  selectedJob = currentJobs.find((job) => job.url === url);
  if (!selectedJob) return;

  jobsList.querySelectorAll(".job-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.url === url);
  });

  const summary = selectedJob.excerpt || selectedJob.description || "No description available.";
  jobDetail.className = "job-detail";
  jobDetail.innerHTML = `
    <div class="detail-header">
      <h3>${escapeHtml(selectedJob.title)}</h3>
      <div class="job-meta">
        <span>${escapeHtml(selectedJob.company)}</span>
        <span>${escapeHtml(selectedJob.location)}</span>
        <span>${escapeHtml(formatPostedDate(selectedJob.datePosted))}</span>
      </div>
    </div>
    <div class="job-description">${escapeHtml(summary)}</div>
  `;

  jobLink.href = selectedJob.url;
  jobLink.classList.remove("disabled");
}

function clearResults() {
  currentJobs = [];
  selectedJob = null;
  jobCount.textContent = "0 found";
  jobsList.className = "jobs-list empty-state";
  jobsList.textContent = "Searching...";
  jobDetail.className = "job-detail empty-state";
  jobDetail.textContent = "Select a job to read the listing summary.";
  jobLink.removeAttribute("href");
  jobLink.classList.add("disabled");
}

function setBusy(isBusy, message, isError = false) {
  form.querySelector(".primary-action").disabled = isBusy;
  statusDot.classList.toggle("busy", isBusy);
  statusStrip.classList.toggle("error", isError);
  statusStrip.lastChild.textContent = ` ${message}`;
}

function formatPostedDate(value) {
  if (!value) return "date unknown";
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "date unknown";
  return `posted ${parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
