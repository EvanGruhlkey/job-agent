# Job Search Agent

Job Search Agent is a local CLI for opening fresh, exact job matches without digging through noisy job-board results. Give it a role, tell it how many links you want, and it searches recent listings, filters out partial matches, and opens the best matches in your browser.

## Install

```bash
npm install
```

## Run

```bash
npm start -- search "Civil Engineer Intern" --how-many 20
```

The app searches recent major-board listings first. It keeps only jobs that match the full role intent, ranks them by freshness, prints the opening queue, and opens the links in your default browser.

If the first recent pass does not find enough exact matches, the app widens the freshness window and tries again. It opens fewer links rather than padding the queue with unrelated jobs.

## Examples

```bash
npm start -- search "Civil Engineer Intern" --how-many 20
npm start -- search "Marketing Intern" --how-many 10
npm start -- search "Finance Analyst Intern" --how-many 10
npm start -- search "Registered Nurse" --location "Chicago, IL" --how-many 15
```

## Configuration

No configuration is required for the default workflow. Use CLI flags when you need to tune a search:

```bash
--how-many 20          Open this many freshest exact matches
--location "Remote"    Add a location
--fresh-days 7         Set the freshness window
--all-sources          Search broader sources, slower
```

`--how-many` opens browser links and does not write reports, JSON indexes, screenshots, or snapshots.

## Matching

The matcher favors exact role intent. For example, `Civil Engineer Intern` can match `Civil Engineering Intern` or `Civil Engineering Co-op Student`, but it should not match a regular `Civil Engineer` role.

When changing matching or ranking behavior, add regression cases to `src/jobIndex/matching.test.js`. The app should prefer opening fewer exact jobs over opening more unrelated jobs.

## Development

From the repository root:

```bash
npm install
npm start -- search "Software Engineer Intern" --how-many 5
```

On Windows PowerShell:

```powershell
npm install
npm start -- search "Software Engineer Intern" --how-many 5
```

Generated runtime files should stay under ignored directories such as `data/`.
