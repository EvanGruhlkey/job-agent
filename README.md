# Job Search Agent

A local CLI that finds fresh, exact job matches and opens them in your browser.

The main workflow is simple: type the role you want, choose how many links to open, and the app opens the freshest matching jobs it can find.

## Setup

```bash
npm install
```

## Open Fresh Job Links

```bash
npm start -- search "Civil Engineer Intern" --how-many 20
```

This searches recent major-board results, keeps only jobs that match the full role intent, and opens the freshest matching links.

In `--how-many` mode, the app does not write reports, JSON indexes, screenshots, or snapshots.

## Examples

```bash
npm start -- search "Software Engineer Intern" --how-many 10
npm start -- search "Marketing Intern" --how-many 10
npm start -- search "Finance Analyst Intern" --how-many 10
npm start -- search "Registered Nurse" --location "Chicago, IL" --how-many 15
```

If the first recent pass does not find enough exact matches, the app widens the freshness window and keeps searching. It opens fewer links rather than filling the queue with unrelated jobs.

## Broader Search

The default `--how-many` search is optimized for speed. Add `--all-sources` when you want a slower, broader crawl:

```bash
npm start -- search "Civil Engineer Intern" --how-many 20 --all-sources
```

## Useful Options

```bash
--how-many 20          Open this many freshest exact matches
--location "Remote"    Add a location
--fresh-days 7         Set the freshness window
--all-sources          Search broader sources, slower
```

## Validation

```bash
npm run check
npm test
```

`npm test` runs title-matching regression tests so searches like `Software Engineer Intern`, `Civil Engineer Intern`, `Marketing Intern`, and `Registered Nurse` stay precise.
