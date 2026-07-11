---
name: data-extractor
description: Extract portfolio content from GitHub repos and a local resume (PDF or DOCX) into a single canonical portfolio.json consumed by the portfolio site. Use when asked to "extract portfolio data", "sync GitHub repos", "parse resume", "refresh portfolio.json", "update portfolio content", or to populate the site from external sources.
model: sonnet
risk_level: MEDIUM
version: 1.0.0
---

# Data Extractor Skill

> Unified pipeline: GitHub repos + local resume (PDF/DOCX) → canonical `portfolio.json`.

## 1. Overview

This skill produces a single `portfolio.json` file the portfolio site reads at build time. Two data sources feed it:

1. **GitHub** — public repo metadata (name, description, language, stars, topics, last push).
2. **Resume** — a local file the user provides (PDF or DOCX), parsed into structured fields.

The two are merged with a documented precedence: **resume wins for personal data, GitHub wins for live project metrics**.

**Risk Level**: MEDIUM — makes outbound network calls (GitHub API), reads user files, writes a structured output. Token must be treated as a secret.

**Primary Use Cases**:
- Initial population of `portfolio.json` from scratch
- Periodic refresh (re-run after resume edits or new repos)
- CI step that updates the site when content changes

## 2. Output Schema

The pipeline writes exactly one file. Schema below is the contract — the site reads it as-is.

```jsonc
{
  "profile": {
    "name": "string",            // full display name
    "tagline": "string",         // one-line role/positioning, e.g. "AI engineer • builder"
    "bio": "string",             // 1-3 sentence bio (markdown allowed)
    "avatar": "string|null",     // URL or local path; null if not provided
    "location": "string|null",
    "email": "string|null"
  },
  "skills": [
    {
      "category": "string",      // e.g. "Languages", "Frameworks", "Tools"
      "items": ["string", "..."]  // ordered, most-used first
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "start": "string",         // ISO YYYY-MM, "YYYY", or null
      "end": "string|null",      // null = current
      "summary": "string",       // 1-2 sentence role summary
      "highlights": ["string"]   // bullet points
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string|null",   // "B.S.", "M.S.", "Ph.D.", etc.
      "field": "string|null",    // "Computer Science"
      "start": "string|null",
      "end": "string|null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "url": "string",           // canonical repo URL
      "language": "string|null", // primary language from GitHub
      "stars": "number",         // 0 if not from GitHub
      "topics": ["string"],
      "source": "github" | "resume",
      "pushedAt": "string|null"  // ISO 8601, null if from resume
    }
  ],
  "contact": {
    "github": "string|null",     // username only, not full URL
    "linkedin": "string|null",   // username or full URL
    "email": "string|null",
    "website": "string|null"
  }
}
```

### Required vs optional

- `profile.name` and at least one of `profile.tagline` or `profile.bio` are **required** — the site renders "untitled" if missing and the validator should fail the build.
- All other fields are optional; missing arrays become `[]`, missing strings become `null`.

## 3. Source A — GitHub Repos

### 3.1 Authentication

Read the token from env var `GITHUB_TOKEN`. Never log the value. Never commit it.

- **With token:** 5,000 req/hr.
- **Without token:** 60 req/hr (unauthenticated, identified by IP).

If the token is absent, log a warning at the start of the run and proceed; pagination across a user with >60 repos will be slow but still works.

### 3.2 Endpoint and pagination

```
GET https://api.github.com/users/{username}/repos?per_page=100&page={n}&sort=pushed&direction=desc
```

- `per_page=100` (max allowed) to minimize round-trips.
- Walk pages until response is empty or `<100` items.
- Read `Link: rel="next"` header for next page.

### 3.3 Field mapping

| JSON field | GitHub source | Notes |
|---|---|---|
| `name` | `name` | |
| `description` | `description` | can be null |
| `url` | `html_url` | |
| `language` | `language` | can be null |
| `stars` | `stargazers_count` | integer |
| `topics` | `topics` | array of strings |
| `pushedAt` | `pushed_at` | ISO 8601 |
| `source` | (constant) | `"github"` |

### 3.4 Filtering and sorting

Apply in this order:

1. Drop `fork: true` (forks of others' work).
2. Drop `archived: true`.
3. Drop repos with **no description AND 0 stars AND 0 topics** (empty husk repos).
4. Keep all others, including private repos the token can see (the user opted in by providing the token).
5. Sort: `pushed_at` desc, then `stargazers_count` desc as tiebreaker.

### 3.5 GitHub → `projects[]`

Each surviving repo becomes one `projects[]` entry with `source: "github"`. Preserve order from §3.4.

## 4. Source B — Resume (PDF / DOCX)

### 4.1 Parser selection

| Extension | Library | Notes |
|---|---|---|
| `.pdf` | `pdf-parse` | Pure-JS, fast, text-layer PDFs only |
| `.docx` | `mammoth` | `.docx` is a zip; mammoth extracts text cleanly |
| `.doc` | (rejected) | Old binary format; convert with `libreoffice --headless --convert-to docx` first, then mammoth |
| `.txt` / `.md` | (read directly) | Skip parsing, use as-is |

For scanned PDFs (no text layer), `pdf-parse` returns empty/near-empty. Fall back to OCR:
- `tesseract.js` for in-process OCR, or
- `pdftoppm` → `tesseract` CLI for higher quality.

**Always check** parser output: if extracted text is < 200 chars for a > 1-page document, treat as scanned and OCR.

### 4.2 LLM-assisted structuring

Raw text is unstructured. Two passes:

**Pass 1 — heuristics:** regex for email, phone, dates, section headers (`Experience`, `Education`, `Skills`). Works for ~70% of standard resumes.

**Pass 2 — LLM fallback:** if heuristics miss or yield conflicting fields, send the full text to the model with a structured prompt:

```
Extract the following fields and return as JSON:
{ name, tagline, bio, location, email,
  skills: [{category, items}],
  experience: [{company, role, start, end, summary, highlights}],
  education: [{institution, degree, field, start, end}],
  contact: {github, linkedin, website} }
Use null for missing fields. Return ONLY valid JSON.
```

Validate the LLM output against the §2 schema with zod before accepting it. On validation failure, retry once with the error message appended to the prompt, then fall back to "best-effort from heuristics" with a clear warning logged.

### 4.3 Field mapping (resume → JSON)

| Resume section | JSON target | Notes |
|---|---|---|
| Header (name, role) | `profile.name`, `profile.tagline` | |
| Summary / About | `profile.bio` | trim, preserve markdown |
| Skills list | `skills[].items` | group into `category` if headings present, else single "Skills" category |
| Job entries | `experience[]` | parse dates: "Jan 2024", "2024", "Present" → ISO YYYY-MM or null |
| Education entries | `education[]` | |
| Footer (github.com/x, linkedin.com/in/y) | `contact.github`, `contact.linkedin` | extract username from URL |
| Project names mentioned in bullets | `projects[]` with `source: "resume"` | only if repo URL or clear identifier is present; otherwise leave to GitHub |

## 5. Merge Rules

Apply in this order:

1. Start with an empty object conforming to §2 (all arrays `[]`, all strings `null`).
2. Apply resume fields verbatim into `profile`, `skills`, `experience`, `education`, `contact` (resume is source of truth for personal data).
3. Apply GitHub `projects[]` — append all to `projects[]`, **but skip** any GitHub repo whose name exactly matches a resume-sourced `projects[].name` (avoid duplication when the resume already mentioned it).
4. Deduplicate `skills[].items` within each category (case-insensitive, trim).
5. Validate the merged result with zod. On failure, log which field failed and why, then write the partial result to a `.failed.json` alongside the regular output — **do not silently overwrite** a previously-good `portfolio.json`.

### Conflict resolution table

| Field | Winner if both sources present |
|---|---|
| `profile.name` | resume |
| `profile.bio` | resume |
| `contact.email` | resume (more likely to be current) |
| `projects[].stars` | GitHub (live) |
| `projects[].pushedAt` | GitHub (live) |
| `projects[].description` | resume if non-empty, else GitHub |

## 6. CLI Usage

The script lives at `scripts/extract.ts` (Vite/React project root). It's run via tsx:

```bash
# Full run: both sources
tsx scripts/extract.ts \
  --github yashraj \
  --resume ./resume.pdf \
  --out src/data/portfolio.json

# GitHub only (no resume yet)
tsx scripts/extract.ts --github yashraj --out src/data/portfolio.json

# Resume only (no GitHub)
tsx scripts/extract.ts --resume ./resume.docx --out src/data/portfolio.json

# Dry run — print to stdout, don't write
tsx scripts/extract.ts --github yashraj --resume ./resume.pdf --dry
```

Flags:

| Flag | Required | Notes |
|---|---|---|
| `--github <username>` | one of | fetches from `https://api.github.com/users/{username}/repos` |
| `--resume <path>` | one of | `.pdf` / `.docx` / `.txt` / `.md` |
| `--out <path>` | yes (unless `--dry`) | output file path |
| `--dry` | no | print JSON to stdout, don't write |
| `--token <pat>` | no | overrides `GITHUB_TOKEN` env var (for one-off use) |

## 7. Validation

Schema enforced with zod. On the final merged object:

- `profile.name` must be a non-empty string.
- `projects[]` must be an array (can be empty).
- `experience[].end === null` is allowed (means "current"); missing `end` is normalized to `null` with a warning.
- `pushedAt` must be ISO 8601 if present.

Failed validation writes `.failed.json` and exits with non-zero status. The previous `portfolio.json` is left intact.

## 8. Implementation Skeleton

```typescript
// scripts/extract.ts
import { readFile, writeFile } from 'node:fs/promises'
import { z } from 'zod'
import mammoth from 'mammoth'
// @ts-ignore — pdf-parse has no types
import pdf from 'pdf-parse'

const PortfolioSchema = z.object({ /* ... §2 ... */ })

async function fetchGithubRepos(user: string, token?: string) {
  // paginate /users/{user}/repos, map fields per §3.3
}

async function parseResume(path: string): Promise<string> {
  // dispatch on extension, return raw text
}

async function structureResume(text: string) {
  // heuristics first, LLM fallback per §4.2
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const github = args.github ? await fetchGithubRepos(args.github, args.token) : []
  const resumeText = args.resume ? await parseResume(args.resume) : ''
  const resume = resumeText ? await structureResume(resumeText) : {}
  const merged = merge(resume, github) // per §5
  const validated = PortfolioSchema.parse(merged)
  if (args.dry) { console.log(JSON.stringify(validated, null, 2)); return }
  await writeFile(args.out, JSON.stringify(validated, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })
```

## 9. Privacy and Token Handling

- The resume file is **never** uploaded anywhere. Parsing happens locally.
- Only public repo metadata is fetched. Private repos are only included if the provided token has access — the user has opted in by giving the token.
- `GITHUB_TOKEN` is read from env, never from CLI args in CI logs, never echoed in errors. The `--token` flag exists for one-off use but should be avoided in scripts that get committed.
- The output `portfolio.json` is safe to commit — it contains no secrets.

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `403 rate limit exceeded` from GitHub | unauthenticated at >60 req/hr | provide `GITHUB_TOKEN` |
| `Bad credentials` | expired/invalid token | rotate token, re-run |
| Resume parser returns `<200` chars on a multi-page PDF | scanned PDF, no text layer | run OCR pass (tesseract) and re-feed |
| `mammoth` throws on `.doc` file | old binary format | convert to `.docx` first: `libreoffice --headless --convert-to docx file.doc` |
| LLM returns invalid JSON for resume structure | model drift | retry with explicit error appended; on second failure use heuristic-only result with warning |
| `zod` validation fails on `profile.name` | empty/whitespace name | check resume parsing; if GitHub-only run, prompt user for name |
| Output looks stale after resume edit | script not re-run | add to pre-commit or `pnpm run extract` |

## 11. Pre-Run Checklist

Before invoking the script:

- [ ] `GITHUB_TOKEN` set in env (or accept 60 req/hr limit)
- [ ] Resume file path verified (`ls -la ./resume.pdf`)
- [ ] Output directory exists (`mkdir -p src/data`)
- [ ] For `.doc` files, conversion to `.docx` complete
- [ ] `tsx` and dependencies installed (`pnpm install`)

After the run:

- [ ] Output file written and parses as valid JSON
- [ ] Spot-check `profile.name` and one `projects[]` entry against the source
- [ ] `pnpm run build` (or `tsc --noEmit`) succeeds — the site consumes the JSON and expects it to type-check

## 12. Summary

`data-extractor` produces one canonical `portfolio.json` from two sources with a clear precedence:

1. Resume → personal data (profile, experience, education, skills)
2. GitHub → live projects and metrics
3. zod validation → fail loudly, never silently overwrite a good file
4. Local-only → resume never leaves the machine; token never logged

The site reads the JSON as-is; the schema here is the contract.
