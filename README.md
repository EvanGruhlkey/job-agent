# Resume Job Agent

Local job search by title and location. Uses public listing pages only—no paid APIs or accounts required.

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Use `npm run dev` for watch mode.

## Overview

Enter a job title, optional location, and a result limit (max 200). The app loads public search results in a headless browser, paginates until the limit is met or listings end, ranks matches by title and location fit, and stores them in `data/job-index.json`.

The UI lists matches with company, location, date, and source board. Select a row to view a summary and open the source posting.

## Job board support

When you press **Find jobs**, supported boards are searched from public pages only. Results are still filtered by the requested job title and location, so a supported board may return zero jobs for a specific search.

| Job board / source | Supported |
| --- | --- |
| LinkedIn | ✅ |
| Indeed | ✅ |
| Greenhouse | ✅ |
| Ashby | ✅ |
| Lever | ✅ |
| GitHub hiring posts | ✅ |
| ZipRecruiter | ✅ |
| Monster | ✅ |
| CareerBuilder | ✅ |
| SimplyHired | ✅ |
| Getwork | ✅ |
| Job.com | ✅ |
| The Ladders | ✅ |
| Nexxt | ✅ |
| Jooble | ✅ |
| Jora | ✅ |
| Talent.com | ✅ |
| Adzuna | ✅ |
| We Work Remotely | ✅ |
| Remote OK | ✅ |
| Remotive | ✅ |
| Remote.co | ✅ |
| Working Nomads | ✅ |
| Himalayas | ✅ |
| NoDesk | ✅ |
| JustRemote | ✅ |
| Wellfound | ✅ |
| Y Combinator Jobs | ✅ |
| Built In | ✅ |
| Dice | ✅ |
| Hacker News Who is Hiring | ✅ |
| Welcome to the Jungle | ✅ |
| Levels.fyi Jobs | ✅ |
| TrueUp | ✅ |
| Hire Tech Ladies | ✅ |
| Crunchboard | ✅ |
| Arc | ✅ |
| Turing | ✅ |
| USAJOBS | ✅ |
| GovernmentJobs | ✅ |
| Idealist | ✅ |
| HigherEdJobs | ✅ |
| Mediabistro | ✅ |
| Poached Jobs | ✅ |
| Craigslist jobs | ✅ |
| Glassdoor | ❌ |
| Handshake | ❌ |
| Simplify.jobs | ❌ |
| Facebook jobs | ❌ |
| X / Twitter jobs | ❌ |

## API

| Endpoint | Purpose |
| --- | --- |
| `POST /api/search` | Primary search (`targetTitle`, `location`, `maxJobs`) |
| `POST /api/index/discover` | Index jobs without the UI |
| `GET /api/index/jobs` | Query the local index |
| `POST /api/index/jobs/:id/tailor` | Resume tailoring (backend only; UI pending) |

## AI

Search is fully deterministic (fetch, parse, score). No API key required.

LLM-backed resume tailoring is planned for a later release. Supporting routes exist; set `OPENAI_API_KEY` when that feature is enabled.

## Constraints

- Listing coverage depends on publicly accessible search pages.
- No application submission, CAPTCHA bypass, or authenticated scraping.
- Resume tailoring is not available in the UI yet.

## Tests

```bash
npm test
```
