---
name: ainext-company-onboarding
description: |
  Add a new company to the ainext assessment pipeline. Researches the company, generates
  a tailored 8-12 question AI readiness assessment, renders a self-hosted HTML form, publishes
  it on GitHub Pages, and wires it to the in-house collection pipeline (Cloudflare Worker →
  GitHub Actions → markdown responses in projects/<slug>/responses/). Zero Google Forms,
  zero manual sheet management, zero shared-state breakage.

  Use this whenever the user says: "add a new company", "set up assessment for X",
  "onboard <company>", "create form for <company>", or similar.
---

# ainext Company Onboarding Skill

End-to-end onboarding for a new partner company. Single command in, working form on the public
internet out, every response auto-archived in git.

## Pipeline (what actually happens)

```
[you tell Claude: "onboard <CompanyName>"]
   ↓
1. Web-research the company (site, LinkedIn, recent news)
2. Decide: use templates/default-questions.json, or draft a tailored questions file
3. Run scripts/add_company.py
     ├─ creates projects/<slug>/{README,STATUS,PROFIL,ASSESSMENT_TEMPLATE,notes/}
     ├─ renders templates/assessment-form.html.tmpl with company data
     ├─ writes projects/<slug>/form.html  (source of truth)
     └─ writes docs/projects/<slug>/index.html  (served by GitHub Pages)
4. git push  →  Pages publishes the form at
     https://ai-next-agency.github.io/ai-next/projects/<slug>/
5. Send the URL to the company.

[respondent submits the form]
   ↓
6. POST → Cloudflare Worker (workers/form-submission.js)
     - CORS allowlist (only ainext-pages domain)
     - 5-min IP rate limit (KV)
     - Slug + email + required-field validation
     - Forwards repository_dispatch to GitHub
7. GitHub Action (.github/workflows/process-assessment.yml)
     - Writes projects/<slug>/responses/<ts>_response.md
     - Regenerates projects/<slug>/<SLUG>_ASSESSMENT_RESULTS.md (aggregate)
     - Commits + pushes
```

There is no Google Forms, no Google Sheets, no daily sync routine. The only stateful
infrastructure is the Cloudflare Worker (one-time deploy) and GitHub.

## How to invoke

When the user asks to onboard a company, do this:

### Step 1 — Research

Use web search and (if available) firecrawl to gather:

- Company tagline + 1-paragraph summary
- Industry + primary product
- Tech stack signals (job posts, engineering blog)
- Anything that hints at AI maturity (existing AI features, ML hires, automation tooling)

Write this into `projects/<slug>/<NAME>_PROFIL.md` after the script creates the folder.

### Step 2 — Decide on questions

Default: use `templates/default-questions.json` (8 questions, generic AI maturity).

Tailor when:
- The company has a strong vertical (marketplace, fintech, content) where domain-specific
  questions surface more signal than generic ones. See `projects/inflow-network/questions.json`
  for an example of an 11-question vertical-tailored set.
- Leadership has a specific worry (compliance, vendor lock-in, hiring) — add 1–2 targeted
  questions on top of the defaults.

If tailoring, write a new `projects/<slug>/questions.json` matching the schema:

```json
[
  {
    "id": "q1",
    "title": "<short title>",
    "label": "<the question>",
    "context": "<why this matters>",
    "options": [
      { "value": 1, "label": "<answer>", "context": "<clarifier>" },
      ...
      { "value": 5, "label": "<answer>", "context": "<clarifier>" }
    ]
  }
]
```

Keep 1–5 scoring (the form averages and labels Initial/Beginner/Developing/Intermediate/Advanced).

### Step 3 — Run the script

```bash
# Default questions
python3 scripts/add_company.py --name "Company Name" --url "https://company.com"

# Custom questions
python3 scripts/add_company.py --name "Company Name" --url "https://company.com" \
  --questions projects/<slug>/questions.json

# Override Worker URL (only if testing against a different deploy)
python3 scripts/add_company.py --name "Company Name" \
  --worker-url "https://form-submission-staging.workers.dev"
```

The script creates the folder, renders both `projects/<slug>/form.html` and
`docs/projects/<slug>/index.html`, and commits the result.

### Step 4 — Push and share

```bash
git push
```

GitHub Pages picks up `/docs` automatically. Send this URL to the company:

```
https://ai-next-agency.github.io/ai-next/projects/<slug>/
```

### Step 5 — Watch responses arrive

Each submission produces a commit on `main`:

- `projects/<slug>/responses/<YYYYMMDD_HHMMSS>_response.md` — individual response
- `projects/<slug>/<SLUG>_ASSESSMENT_RESULTS.md` — aggregate, regenerated each time

No further action required.

## Operational notes

- **One-time infra:** the Cloudflare Worker is deployed once for the whole agency.
  See `workers/wrangler.toml` and `WORKER_DEPLOYMENT_GUIDE.md`. KV namespace
  `FORM_SUBMISSIONS` and secret `GITHUB_TOKEN` must exist in the Worker environment.
- **Adding a new origin** (e.g., a custom landing domain for a client): add it to
  `allowedOrigins` in `workers/form-submission.js` and redeploy.
- **Customizing branding per-company:** the template is intentionally minimal and uses
  the same color scheme for everyone. If a client requires their own branding, copy the
  rendered `projects/<slug>/form.html` and edit by hand — it's a single self-contained
  HTML file.
- **Removing a company:** delete `projects/<slug>/` and `docs/projects/<slug>/`, commit.

## Anti-patterns

- ❌ Don't re-introduce Google Forms or Google Sheets. The whole point of this pipeline is
  that there's no third-party shared mutable state to break.
- ❌ Don't put the GitHub token anywhere except the Cloudflare Worker secret store.
- ❌ Don't loosen the `^[a-z0-9-]{1,50}$` slug check in the Worker — it prevents path
  traversal in the Action.
- ❌ Don't write per-company GitHub Actions. The single workflow handles all companies via
  the `company` field in the dispatch payload.
