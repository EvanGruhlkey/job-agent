# Job Search Agent

A local CLI that searches major job boards and public career pages, returning hundreds of listings and saving them to `data/jobs.md`.

## Setup

```bash
npm install
```

## Search

```bash
npm start -- search "Software Engineer" --how-many 5
```

That checks a deeper pool of posts, keeps the freshest five matches, and opens each job link in your browser without writing a jobs report.

Add a location:

```bash
npm start -- search "Software Engineer" --location "Remote" --how-many 10
```

If you want the old written report, use `--max` instead:

```bash
npm start -- search "Software Engineer" --location "Remote" --max 200
```

Search updates `data/job-index.json`. When you use `--max`, it also writes a readable report to `data/jobs.md`; `--how-many` opens links instead.

## Fresh Feed

Use `feed` for an Intern List-style CLI feed: recent jobs, source stats, new-today counts, category counts, and freshness proof.

```bash
npm start -- feed --category software --location "United States" --fresh-days 7 --max 200
```

Feed searches the broad source catalog by default. For a quicker smoke run, use:

```bash
npm start -- feed --category software --location "Remote" --max 25 --fast
```

See supported role shortcuts:

```bash
npm start -- categories
```

## List Saved Jobs

```bash
npm start -- list "Software Engineer"
```

This reads from the local index instead of searching the web again.

## Options

```bash
--location "Remote"
--how-many 5
--open
--no-write
--category software
--fresh-days 7
--all-sources
--fast
--max 200
--output data/jobs.md
```

The output format is inferred from the file name. Use `.md` for Markdown or `.txt` for plain text.
