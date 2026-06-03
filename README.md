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

## Crawled job sources

When you press **Find jobs**, the crawler searches and normalizes jobs from these public sources. Results are still filtered by the requested job title and location, so a source may be searched but contribute zero results if its jobs do not match.

| Source group | Boards / domains | How it is crawled | Notes |
| --- | --- | --- | --- |
| LinkedIn | `linkedin.com/jobs/search` | Opens public search result pages in a headless browser, scrolls/paginates, and parses visible job cards. | Often returns the most results, but may block or throttle public crawling. |
| Indeed | `indeed.com/jobs` | Opens public search result pages, paginates with `start`, and parses visible job cards. | Sorted by date when possible. |
| Greenhouse | `boards.greenhouse.io`, `job-boards.greenhouse.io` | Discovers public boards, then uses Greenhouse public board/job JSON endpoints when possible. | Seeded boards include Anduril, Figma, and Verkada. Strict title matching rejects broad board results that do not match the requested role. |
| Ashby | `jobs.ashbyhq.com` | Discovers public boards, then uses Ashby public posting endpoints when possible. | Seeded boards include OpenAI, Anthropic, and Notion. Some Ashby boards do not expose a title search field, so matching happens after extraction. |
| Lever | `jobs.lever.co` | Discovers public Lever boards and uses Lever public postings endpoints when possible. | Contributes results only when discovered postings match the requested title/location. |
| GitHub hiring | `github.com`, `gist.github.com` | Searches public GitHub issues, repos, topics, and gists for hiring, internship, new-grad, careers, and apply links. | GitHub results are noisy, so extracted jobs must pass strict title matching. |
| General boards | ZipRecruiter, Monster, CareerBuilder, SimplyHired, Getwork, Job.com, The Ladders, Nexxt, Jooble, Jora, Talent.com, Adzuna | Searches public web results constrained to those domains, fetches candidate job pages, and normalizes the posting text. | Coverage depends on what each board exposes publicly. |
| Remote and niche boards | We Work Remotely, Remote OK, Remotive, Remote.co, Working Nomads, Himalayas, NoDesk, Wellfound, Y Combinator, Built In, Dice, USAJOBS, GovernmentJobs, Idealist, HigherEdJobs, Mediabistro, Poached, Craigslist, and others | Searches public web results constrained to remote, startup, tech, government, nonprofit, education, media, hospitality, and other niche board domains. | These sources are filtered after extraction; login/CAPTCHA/user-review pages are skipped. |

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
