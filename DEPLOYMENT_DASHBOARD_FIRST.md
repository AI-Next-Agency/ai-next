# Dashboard-First Response Storage: Deployment Guide

**Timeline**: 1 week (phased)  
**Difficulty**: Medium  
**Team Size**: 1 backend + 1 frontend dev  

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Employee fills form (form.html)                              │
└─────────────────┬───────────────────────────────────────────┘
                  │ JSON POST
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Worker (responses-api.ts)                         │
│ - Validates input                                            │
│ - Inserts into D1 (responses table)                          │
│ - Updates 5 pre-aggregated tables (50ms)                     │
│ - Returns success response                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare D1 (SQLite Database)                              │
│ - responses, answers (raw data)                              │
│ - 5 aggregated tables (pre-computed)                         │
│ - Strategic indexes for <50ms queries                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ React Dashboard (Dashboard.tsx)                              │
│ - Queries /api/analytics/dashboard every 30s                │
│ - Shows real-time charts, distributions, trends             │
│ - <50ms response time (pre-computed data)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Setup (Day 1)

### 1.1: Create D1 Database

```bash
# Create database
wrangler d1 create ai-next-responses

# Apply schema
wrangler d1 execute ai-next-responses --file src/db/schema.sql

# Verify
wrangler d1 execute ai-next-responses --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output:
```
companies
questions
responses
answers
company_daily_metrics
company_maturity_distribution
company_score_distribution
company_question_metrics
company_submission_timeline
```

### 1.2: Seed Companies

```bash
wrangler d1 execute ai-next-responses --command "
INSERT INTO companies (id, slug, name) VALUES
('inflow-1', 'inflow-network', 'INFLOW Network'),
('fizix-1', 'fizix-ai', 'Fizix AI');
"
```

### 1.3: Seed Questions for Each Company

Get question data from:
- `projects/inflow-network/form.html` (QUESTIONS array, lines 103+)
- `projects/fizix-ai/form.html` (QUESTIONS array)

Insert into D1:
```bash
wrangler d1 execute ai-next-responses --command "
INSERT INTO questions (id, company_id, question_id, title, label, context, options, version)
VALUES
('inflow-q1', 'inflow-1', 'q1', 'Creator Discovery & Matching', '...', '...', '[{\"value\": 1, ...}]', 1),
-- (repeat for all 11 Inflow questions)
-- (repeat for all Fizix questions)
"
```

### 1.4: Configure wrangler.toml

```toml
[env.production]
name = "ai-next-responses"
routes = [
  { pattern = "api.inflownetwork.com/*", zone_id = "..." },
  { pattern = "api.fizix.ai/*", zone_id = "..." }
]

[[env.production.d1_databases]]
binding = "DB"
database_name = "ai-next-responses"
database_id = "<FROM_STEP_1.1>"

[env.production.vars]
API_SECRET = "your-secret-token"
```

---

## Phase 2: Worker Deployment (Day 2)

### 2.1: Install Dependencies

```bash
npm install hono @cloudflare/workers-types recharts
npm install -D typescript wrangler
```

### 2.2: Build & Deploy Worker

```bash
# Dev
wrangler dev --env production

# Test locally
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "company": "inflow-network",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Product",
    "role": "PM",
    "questions": [
      {"id": "q1", "question": "...", "answer": "4", "score": 4}
    ],
    "aiMaturityScore": 4.0,
    "maturityLevel": "Intermediate"
  }'

# Deploy
wrangler deploy --env production
```

### 2.3: Test Live Endpoint

```bash
# Create test submission
curl -X POST https://form-submission.inflownetwork.com/api/responses \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Expected: { "success": true, "responseId": "...", "timestamp": "..." }
```

### 2.4: Test Protected Endpoint

```bash
curl -X GET "https://form-submission.inflownetwork.com/api/analytics/dashboard?company=inflow-network" \
  -H "Authorization: Bearer YOUR_API_SECRET"

# Expected: Dashboard JSON with totalResponses, timeline, maturity distribution, etc.
```

---

## Phase 3: Update Form Submission (Day 3)

### 3.1: Modify form-submission.js

Currently, the form POSTs to the Worker and the Worker triggers GitHub Actions.

**New behavior**: Worker directly inserts into D1.

Update `workers/form-submission.js`:

**Before**:
```javascript
// Trigger GitHub Action
fetch('https://api.github.com/repos/.../dispatches', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${env.GITHUB_TOKEN}` },
  body: JSON.stringify({ event_type: 'assessment-submission', client_payload: payload })
})
```

**After**:
```javascript
// D1 insert happens in responses-api.ts
// Just return success directly
return new Response(JSON.stringify({ success: true, responseId: payload.id }), {
  status: 201,
  headers: { 'Content-Type': 'application/json' }
})
```

### 3.2: Test Form Submission

1. Open `https://ai-next-agency.github.io/projects/inflow-network/form.html`
2. Fill out the form
3. Submit
4. Check D1:
   ```bash
   wrangler d1 execute ai-next-responses --command "SELECT * FROM responses ORDER BY submitted_at DESC LIMIT 1;"
   ```

### 3.3: Verify Aggregates Updated

```bash
# Check daily metrics
wrangler d1 execute ai-next-responses --command "SELECT * FROM company_daily_metrics WHERE company_id = 'inflow-1';"

# Check maturity distribution
wrangler d1 execute ai-next-responses --command "SELECT * FROM company_maturity_distribution WHERE company_id = 'inflow-1';"
```

---

## Phase 4: Dashboard Frontend (Days 4-5)

### 4.1: Create React App or Next.js Page

**Option A: Standalone React (React + Vite)**
```bash
npm create vite@latest dashboard -- --template react
cd dashboard
npm install recharts
```

**Option B: Next.js (Recommended)**
```bash
npx create-next-app@latest dashboard
npm install recharts
```

### 4.2: Add Dashboard Component

Copy `src/components/Dashboard.tsx` into your project.

### 4.3: Create Dashboard Page

**Next.js** (`pages/dashboard.tsx`):
```typescript
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const company = process.env.NEXT_PUBLIC_COMPANY || 'inflow-network';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://form-submission.inflownetwork.com';
  const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;

  if (!apiToken) {
    return <div>Error: API token not configured</div>;
  }

  return <Dashboard company={company} apiUrl={apiUrl} apiToken={apiToken} />;
}
```

### 4.4: Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_COMPANY=inflow-network
NEXT_PUBLIC_API_URL=https://form-submission.inflownetwork.com
NEXT_PUBLIC_API_TOKEN=your-secret-token
```

### 4.5: Run Dashboard

```bash
npm run dev
# Open http://localhost:3000
```

Should see:
- ✅ Total Responses count
- ✅ Average AI Maturity Score
- ✅ Submission timeline chart
- ✅ Maturity level pie chart
- ✅ Score distribution bar chart
- ✅ Question metrics
- ✅ Recent responses table

### 4.6: Deploy Dashboard

**Option A: Vercel** (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

**Option B: GitHub Pages** (Vite)
```bash
npm run build
# Deploy dist/ folder to GitHub Pages
```

**Option C: Cloudflare Pages**
```bash
wrangler pages deploy dist/
```

---

## Phase 5: Testing (Days 5-6)

### 5.1: Load Testing

Send 100 rapid submissions:
```bash
for i in {1..100}; do
  curl -X POST https://form-submission.inflownetwork.com/api/responses \
    -H "Content-Type: application/json" \
    -d "{
      \"company\": \"inflow-network\",
      \"name\": \"Test $i\",
      \"email\": \"test$i@example.com\",
      \"department\": \"Engineering\",
      \"role\": \"Engineer\",
      \"questions\": [{\"id\": \"q1\", \"question\": \"...\", \"answer\": \"3\", \"score\": 3}],
      \"aiMaturityScore\": 3.0,
      \"maturityLevel\": \"Developing\"
    }" &
done
wait
```

Expected:
- ✅ All 100 succeed
- ✅ Dashboard loads <100ms
- ✅ Aggregates updated in real-time

### 5.2: Dashboard Performance

```bash
# Cold load (first request)
time curl -H "Authorization: Bearer TOKEN" \
  "https://form-submission.inflownetwork.com/api/analytics/dashboard?company=inflow-network"

# Should be <50ms

# Warm load (second request)
time curl -H "Authorization: Bearer TOKEN" \
  "https://form-submission.inflownetwork.com/api/analytics/dashboard?company=inflow-network"

# Should be <10ms (cached)
```

### 5.3: Data Consistency

Verify aggregates match raw data:
```bash
# Get total from responses table
SELECT COUNT(*) FROM responses WHERE company_id = 'inflow-1';

# Get sum from daily metrics
SELECT SUM(submission_count) FROM company_daily_metrics WHERE company_id = 'inflow-1';

# Should match
```

---

## Phase 6: Deprecate GitHub Actions (Day 7)

### 6.1: Stop Triggering GitHub Actions

Disable the GitHub Actions workflow that processes assessments:
```bash
# Rename the workflow to disable it
mv .github/workflows/process-assessment.yml .github/workflows/process-assessment.yml.disabled

# OR update it to only run manually
# Change trigger from `repository_dispatch` to `workflow_dispatch`
```

### 6.2: Archive Response Markdown Files

Optional: Keep historical markdown files as backup
```bash
git rm projects/*/responses/*.md projects/*_ASSESSMENT_RESULTS.md
git commit -m "chore: archive markdown responses (now in D1)"
```

### 6.3: Update Documentation

Update `README.md` and project-level docs to reference the dashboard instead of markdown files.

---

## Monitoring & Maintenance

### Check Database Size

```bash
wrangler d1 execute ai-next-responses --command "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"
```

Target: Keep <100 MB (free tier allows 3 GB)

### Monitor Query Performance

Add logging to responses-api.ts:
```typescript
const startTime = Date.now();
const result = await env.DB.prepare(...).first();
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms`);
```

Expect:
- INSERT: <200ms
- GET dashboard: <50ms cold, <5ms cached

### Scale Beyond 100k Responses

If you exceed 100k responses:
1. Archive old responses to separate "archive" table
2. Keep only recent 1 year in hot table
3. Consider sharding by company_id

---

## Rollback Plan

If anything goes wrong:

1. **Form submissions failing?**
   - Check D1 is accessible: `wrangler d1 execute ai-next-responses --command "SELECT 1;"`
   - Check Worker logs: `wrangler tail`
   - Rollback to GitHub Actions: re-enable `process-assessment.yml`

2. **Dashboard showing stale data?**
   - Clear Cloudflare cache: `wrangler cache purge`
   - Manually refresh aggregates: Run SQL update statements

3. **Database corrupted?**
   - Create backup: `wrangler d1 backup ai-next-responses`
   - Restore from last known good state
   - Reseed data from markdown files (historical)

---

## Success Criteria

✅ All form submissions stored in D1 within 200ms  
✅ Dashboard queries execute <50ms (cold), <5ms (cached)  
✅ Real-time maturity distribution visible  
✅ Filter by company, date, score range works  
✅ Zero Google Sheets dependency  
✅ GitHub Actions deprecated  

---

## Next Steps (After Deployment)

1. **Webhooks** (Day 8): Slack notification on each submission
2. **CSV Export** (Day 9): Download responses as CSV for analysis
3. **Advanced Filtering** (Day 10): Filter by department, role, score range
4. **Recommendations Engine** (Week 2): Auto-generate curriculum recommendations based on scores

---

## Questions?

Refer to:
- Schema: `src/db/schema.sql`
- Worker: `src/workers/responses-api.ts`
- Dashboard: `src/components/Dashboard.tsx`
- API: `DEPLOYMENT_API_REFERENCE.md` (coming)
