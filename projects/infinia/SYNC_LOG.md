# INFINIA Assessment Sync Log

## 2026-04-26 — Google Sheets sync RETIRED

The Google Sheets-based sync routine for INFINIA has been retired. The pipeline now uses the in-house flow (HTML form on GitHub Pages → Cloudflare Worker → GitHub Actions → `responses/`).

**Reason for retirement:** The INFINIA Google Sheet
(`https://docs.google.com/spreadsheets/d/1WlCetSDiPZeqSeLPRLIWj00c3Uhdx-ulUbne4Y_UN3M/edit`)
required authentication that the daily sync routine could not satisfy. Repeated runs (2026-04-24, 2026-04-25) confirmed the sheet was not publicly readable.

**Decision:** Drop the prior responses (none were ever accessibly synced) and start fresh with the new pipeline. Run `python scripts/add_company.py --name "Infinia"` (or render the form for the existing folder) to publish the form on GitHub Pages.

---

## Historical Runs (for the record)

- 2026-04-24 — sheet not accessible (auth required)
- 2026-04-25 — sheet not accessible (auth required)
- 2026-04-26 — flow retired
