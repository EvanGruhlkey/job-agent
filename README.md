# Job Search Agent

A local CLI that searches major job boards and public career pages, returning hundreds of listings and saving them to `data/jobs.md`.

## Setup

```bash
npm install
```

## Search

```bash
npm start -- search "Software Engineer"
```

Add a location or request more results:

```bash
npm start -- search "Software Engineer" --location "Remote" --max 200
```

You can also omit `search`:

```bash
npm start -- "Software Engineer"
```

Search updates `data/job-index.json` and writes a readable report to `data/jobs.md`. By default it finds up to 100 jobs; use `--max` to go up to 500.

## List Saved Jobs

```bash
npm start -- list "Software Engineer"
```

This reads from the local index instead of searching the web again.

## Options

```bash
--location "Remote"
--max 200
--output data/jobs.md
```

The output format is inferred from the file name. Use `.md` for Markdown or `.txt` for plain text.
