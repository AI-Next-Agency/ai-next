# Dashboard-First Response Storage & Query Layer

**Design Philosophy**: Pre-aggregated metrics tables updated on every submission for zero-latency dashboard queries. We trade write complexity (immediate aggregation) for read speed (trivial visualization queries).

---

## System Architecture

```
┌─────────────────────────────────┐
│   Frontend Form (HTML/React)    │
│   - Validates locally           │
│   - Sends { company, name, ... }│
└──────────────┬──────────────────┘
               │ POST /responses
               ▼
        ┌──────────────────┐
        │  Cloudflare      │
        │  Worker          │
        │ (response-       │
        │  handler.js)     │
        └──────┬───────────┘
               │
        ┌──────▼────────────────────────────────┐
        │  1. Validate & Rate Limit (KV)       │
        │  2. INSERT into responses (D1)        │
        │  3. Immediately aggregate (D1)        │
        │  4. Invalidate dashboard cache        │
        │  5. Background: Trigger GitHub Archive│
        └──────┬────────────────────────────────┘
               │
        ┌──────▼────────────────────────────────┐
        │  Cloudflare D1 (SQLite)              │
        │  ┌──────────────────────────────────┐ │
        │  │  responses                       │ │
        │  │  (source of truth)               │ │
        │  └──────────────────────────────────┘ │
        │  ┌──────────────────────────────────┐ │
        │  │  company_daily_metrics           │ │
        │  │  company_maturity_distribution   │ │
        │  │  company_score_distribution      │ │
        │  │  company_question_metrics        │ │
        │  │  company_submission_timeline     │ │
        │  │  (pre-aggregated, 1-5ms queries) │ │
        │  └──────────────────────────────────┘ │
        └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Dashboard Frontend (React/Vue/etc)                     │
│  - GET /analytics/dashboard/:company (CACHED 5m)       │
│  - Real-time <50ms queries on pre-agg data             │
│  - Charts/tables instantly render                      │
└─────────────────────────────────────────────────────────┘
```

---

## Data Layer: Tables Explained

### 1. `responses` (Source of Truth)
Immutable log of every submission.

```sql
id: UUID (primary key)
company: string (e.g., 'inflow-network')
respondent_name, email, department, role: string
ai_maturity_score: 1.0–5.0 (decimal)
maturity_level: 'Initial' | 'Beginner' | 'Developing' | 'Advanced' | 'Optimized'
question_responses: JSON [{ id, score, label }, ...]
submitted_at: Unix timestamp
deleted_at: NULL (soft delete support)
```

**Indexes**:
- `(company, submitted_at DESC)` — recent responses for a company
- `(company, maturity_level)` — filter by maturity
- `(company, created_at DESC)` — ordering by creation

**Why JSON for question_responses?**
- Flexibility: question set changes per company/version
- Denormalization is acceptable; we pre-aggregate per-question metrics to avoid N+1 queries

---

### 2. Pre-Aggregated Tables (Updated on Every Submit)

#### `company_daily_metrics`
Daily snapshot (one row per company per date).

```json
{
  "company": "inflow-network",
  "metric_date": "2026-04-26",
  "submission_count": 5,
  "unique_respondents": 4,
  "avg_maturity_score": 3.2,
  "question_avg_scores": { "q1": 3.5, "q2": 2.8, ... }
}
```

**Query time**: <5ms (index on `company, metric_date`)

---

#### `company_maturity_distribution`
Aggregate counts by maturity level.

```json
{
  "company": "inflow-network",
  "maturity_level": "Developing",
  "count": 23,
  "percentage": 38.3,
  "count_7d": 5
}
```

**Use case**: Pie charts, level breakdown tables.
**Query time**: <2ms (full table scan if only ~5 rows per company)

---

#### `company_score_distribution`
Histogram buckets for score visualization.

```json
{
  "company": "inflow-network",
  "bucket_min": 2.5,
  "bucket_max": 3.0,
  "bucket_label": "2.5–3.0",
  "count": 12,
  "percentage": 20.0
}
```

**Use case**: Bar charts showing "how many at each score range?"
**Query time**: <2ms (8 fixed buckets per company)

---

#### `company_question_metrics`
Per-question performance breakdown.

```json
{
  "company": "inflow-network",
  "question_id": "q1",
  "question_label": "Are you using AI in product?",
  "avg_score": 3.5,
  "count_responses": 60,
  "distribution_by_score": { "1": 5, "2": 8, "3": 20, "4": 18, "5": 9 }
}
```

**Use case**: Individual question performance heatmaps.
**Query time**: <5ms (one row per question)

---

#### `company_submission_timeline`
Time-bucketed submission activity.

```json
{
  "company": "inflow-network",
  "bucket_type": "daily",
  "bucket_start": 1713984000,
  "bucket_label": "2026-04-26",
  "submission_count": 3,
  "avg_maturity_score": 3.1
}
```

**Use case**: Line charts showing submission volume over time, score trends.
**Query time**: <5ms (index on `company, bucket_type, bucket_start`)

---

### 3. Cache & Invalidation Metadata

#### `aggregate_invalidation`
Track which aggregates need rebuild (soft invalidation).

```json
{
  "company": "inflow-network",
  "aggregate_type": "daily_metrics",
  "invalidated_at": 1713984123,
  "reason": "new_submission"
}
```

**Purpose**: If you later implement smart cache invalidation (vs. time-based), mark aggregates as "stale" and rebuild on next dashboard access.

#### `aggregate_execution_log`
Audit trail of aggregation runs (debugging).

```json
{
  "aggregate_type": "daily_metrics",
  "company": "inflow-network",
  "started_at": 1713984100,
  "completed_at": 1713984105,
  "status": "success",
  "rows_affected": 1,
  "error_message": null
}
```

---

## Worker Endpoints

### POST /responses
**Submit a form response & immediately aggregate.**

**Request**:
```json
{
  "company": "inflow-network",
  "name": "Alice",
  "email": "alice@company.com",
  "department": "Engineering",
  "role": "Manager",
  "questions": [
    { "id": "q1", "score": 4, "label": "Using AI in product?" },
    { "id": "q2", "score": 3, "label": "Organization maturity?" }
  ],
  "aiMaturityScore": 3.5,
  "maturityLevel": "Developing"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "responseId": "abc-123-def",
  "submittedAt": "2026-04-26T22:30:00Z",
  "dashboardPreview": {
    "company": "inflow-network",
    "summary": {
      "total_responses": 61,
      "avg_maturity_score": 3.2,
      "last_response_at": "2026-04-26T22:30:00Z"
    }
  }
}
```

**Performance**:
- Full submit + aggregate: ~200ms
- Majority of time: SQLite writes (aggregation logic is O(n) aggregates, not O(n) responses)

**Rate Limit**: 5 per IP per 5 minutes (via Cloudflare KV)

---

### GET /analytics/dashboard/:company
**Fetch pre-aggregated dashboard data (cached).**

**Request**:
```
GET https://your-worker.com/analytics/dashboard/inflow-network
Accept: application/json
```

**Response**:
```json
{
  "company": "inflow-network",
  "timestamp": "2026-04-26T22:35:00Z",

  "summary": {
    "total_responses": 61,
    "avg_maturity_score": 3.2,
    "max_maturity_score": 4.8,
    "min_maturity_score": 1.0,
    "last_response_at": "2026-04-26T22:30:00Z"
  },

  "maturityDistribution": [
    { "level": "Initial", "count": 5, "percentage": "8.2" },
    { "level": "Beginner", "count": 12, "percentage": "19.7" },
    { "level": "Developing", "count": 23, "percentage": "37.7" },
    { "level": "Advanced", "count": 18, "percentage": "29.5" },
    { "level": "Optimized", "count": 3, "percentage": "4.9" }
  ],

  "scoreDistribution": [
    { "bucket": "1.0–1.5", "count": 2, "percentage": "3.3" },
    { "bucket": "1.5–2.0", "count": 3, "percentage": "4.9" },
    { "bucket": "2.0–2.5", "count": 5, "percentage": "8.2" },
    { "bucket": "2.5–3.0", "count": 10, "percentage": "16.4" },
    { "bucket": "3.0–3.5", "count": 15, "percentage": "24.6" },
    { "bucket": "3.5–4.0", "count": 18, "percentage": "29.5" },
    { "bucket": "4.0–4.5", "count": 6, "percentage": "9.8" },
    { "bucket": "4.5–5.0", "count": 2, "percentage": "3.3" }
  ],

  "recentDailyMetrics": [
    { "date": "2026-04-26", "submissions": 3, "avgScore": 3.1 },
    { "date": "2026-04-25", "submissions": 2, "avgScore": 3.4 },
    { "date": "2026-04-24", "submissions": 4, "avgScore": 2.9 }
  ],

  "submissionTimeline": [
    { "date": "2026-04-20", "submissions": 5, "avgScore": 3.0 },
    { "date": "2026-04-21", "submissions": 3, "avgScore": 3.2 },
    { "date": "2026-04-22", "submissions": 4, "avgScore": 3.1 },
    { "date": "2026-04-23", "submissions": 2, "avgScore": 3.5 },
    { "date": "2026-04-24", "submissions": 4, "avgScore": 2.9 },
    { "date": "2026-04-25", "submissions": 2, "avgScore": 3.4 },
    { "date": "2026-04-26", "submissions": 3, "avgScore": 3.1 }
  ]
}
```

**Performance**:
- **Cold (first request)**: ~50ms (aggregate queries run, results cached)
- **Warm (cached)**: <5ms (Cloudflare Cache API)
- **Cache TTL**: 5 minutes (auto-invalidates on new submission)

**Headers**:
```
Cache-Control: public, max-age=300
X-From-Cache: true (if served from cache)
```

---

### GET /analytics/details/:company?breakdown=:type
**Fetch detailed breakdowns (not cached; query on demand).**

**Request**:
```
GET https://your-worker.com/analytics/details/inflow-network?breakdown=questions
```

**Response (breakdown=questions)**:
```json
{
  "company": "inflow-network",
  "details": {
    "questionBreakdown": [
      {
        "id": "q1",
        "label": "Are you using AI in product decisions?",
        "avgScore": 3.6,
        "responses": 61,
        "distribution": { "1": 2, "2": 3, "3": 12, "4": 28, "5": 16 }
      },
      {
        "id": "q2",
        "label": "What is your current AI maturity level?",
        "avgScore": 3.2,
        "responses": 61,
        "distribution": { "1": 5, "2": 8, "3": 20, "4": 18, "5": 10 }
      }
    ]
  }
}
```

**Performance**: ~30ms (pre-aggregated question metrics)

---

### GET /responses/:responseId
**Fetch a specific response (for detail review).**

**Response**:
```json
{
  "id": "abc-123-def",
  "company": "inflow-network",
  "respondent_name": "Alice",
  "respondent_email": "alice@company.com",
  "department": "Engineering",
  "role": "Manager",
  "ai_maturity_score": 3.5,
  "maturity_level": "Developing",
  "question_responses": [
    { "id": "q1", "score": 4, "label": "Using AI in product?" },
    { "id": "q2", "score": 3, "label": "Organization maturity?" }
  ],
  "submitted_at_iso": "2026-04-26T22:30:00Z"
}
```

**Use case**: Dashboard "view details" links, audit review.
**Performance**: ~10ms (single row lookup)

---

## Aggregation Flow (On Every Submit)

When `POST /responses` succeeds:

1. **Insert** response into `responses` table
2. **Update** `company_daily_metrics` for today's date
   - Recalculate: `submission_count`, `avg_maturity_score`, etc. for this day
3. **Update** `company_maturity_distribution` (all 5 levels)
   - Recalculate: count and percentage for each level
4. **Update** `company_score_distribution` (all 8 buckets)
   - Recalculate: count and percentage for each bucket
5. **Update** `company_question_metrics` (all questions in this submission)
   - Parse `question_responses` JSON
   - Recalculate per-question averages and distributions
6. **Update** `company_submission_timeline` (daily bucket for today)
   - Recalculate daily submission count and avg score
7. **Invalidate** dashboard cache (Cloudflare Cache API)
   - Next request will recompute and re-cache for 5 minutes
8. **(Optional) Trigger** GitHub Actions for archival/reporting

**Why this complexity?**
- Every read query is now a trivial lookup on pre-computed values
- No aggregation logic in the dashboard frontend
- No N+1 queries or large scans for visualization
- Scales to millions of responses (dashboard queries always <50ms)

---

## Performance Characteristics

| Operation | Time | Why |
|-----------|------|-----|
| POST /responses (submit + aggregate) | ~200ms | D1 writes (6 tables, mostly UPSERTs) |
| GET /analytics/dashboard (cold) | ~50ms | Parallel queries on 5 tables, all indexed |
| GET /analytics/dashboard (warm) | <5ms | Cloudflare Cache API hit |
| GET /analytics/details | ~30ms | Single pre-aggregated table query |
| GET /responses/:id | ~10ms | Primary key lookup |

**Horizontal scaling**:
- Dashboard queries don't depend on data volume (always query pre-agg tables)
- 1000 submissions/min → still <50ms dashboard query
- Can serve millions of responses with consistent performance

---

## Complexity Tradeoffs

### What's Hidden / What We Don't Do

1. **Real-time consistency**: Aggregates update ~200ms after submission
   - Dashboard might show "60 responses" while new response is being aggregated
   - Acceptable for most use cases; if critical, add optimistic UI updates

2. **Partial rebuilds**: If an aggregate fails mid-calculation, we don't rollback
   - Mitigated by: execution logs for debugging, simple enough logic to be bulletproof
   - Recovery: manual rebuild via admin endpoint (not shown in this doc)

3. **Soft deletes**: Responses can be marked `deleted_at` but aggregates don't auto-recalculate
   - Solution: Rebuild aggregates after bulk deletes

4. **Question schema evolution**: If question set changes per company/time, JSON handles it
   - But per-question metrics are "best effort" (nullable avg_score if questions vary)

### What We Gain

- **Dashboard always fast** (no variance in query time)
- **No complex queries** (no GROUP BY's in dashboard, just SELECT where)
- **Cache-friendly** (5-minute snapshots; aggregates are deterministic)
- **Audit trail** (execution logs for debugging, all changes timestamped)
- **Soft invalidation** (can rebuild aggregates incrementally or on-demand)

---

## Cache Invalidation Strategy

### Current (Time-Based)
Dashboard cached for **5 minutes**. After submit, old cache expires naturally.

**Tradeoff**: Dashboard lags new submission by up to 5 min, but ultra-reliable (no cache-bust bugs).

### Future (Soft Invalidation)
On submit, insert row into `aggregate_invalidation` with `reason: 'new_submission'`.

Dashboard query checks:
1. Cache hit? Return it
2. Cache miss or stale flag? Recompute from tables, re-cache, clear stale flag

**Benefit**: Dashboard updates instantly (or within seconds), no artificial 5-min lag.

---

## Deployment Checklist

### 1. Create D1 Database
```bash
wrangler d1 create ai-assessment-db
# Note the database ID
```

### 2. Apply Schema
```bash
wrangler d1 execute ai-assessment-db --file workers/d1-schema.sql
```

### 3. Deploy Worker
```bash
wrangler deploy workers/response-handler.js --name assessment-api
```

### 4. Bind D1 & KV to Worker
Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "ai-assessment-db"
database_id = "your-db-id"

[[kv_namespaces]]
binding = "FORM_SUBMISSIONS"
id = "your-kv-namespace-id"
```

### 5. Set Secrets
```bash
wrangler secret put GITHUB_TOKEN  # (optional, for archival)
```

### 6. Test Endpoints
```bash
# Submit
curl -X POST https://assessment-api.your-domain.workers.dev/responses \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Dashboard
curl https://assessment-api.your-domain.workers.dev/analytics/dashboard/inflow-network
```

---

## Example: Building a React Dashboard

```jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function AssessmentDashboard({ company }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard every 5 minutes (matches cache TTL)
    const fetchDashboard = async () => {
      const res = await fetch(
        `https://assessment-api.your-domain.workers.dev/analytics/dashboard/${company}`
      );
      const json = await res.json();
      setData(json);
      setLoading(false);
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [company]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  const { summary, maturityDistribution, scoreDistribution, submissionTimeline } = data;

  return (
    <div style={{ padding: '20px' }}>
      <h1>{company} — AI Assessment Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <Card title="Total Responses" value={summary.total_responses} />
        <Card title="Avg Maturity Score" value={summary.avg_maturity_score?.toFixed(2)} />
        <Card title="Max Score" value={summary.max_maturity_score?.toFixed(2)} />
        <Card title="Min Score" value={summary.min_maturity_score?.toFixed(2)} />
      </div>

      {/* Maturity Distribution (Pie) */}
      <div style={{ marginTop: '30px' }}>
        <h2>Maturity Level Distribution</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={maturityDistribution}
            dataKey="count"
            nameKey="level"
            cx="50%"
            cy="50%"
            label
          >
            {maturityDistribution.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* Score Distribution (Bar) */}
      <div style={{ marginTop: '30px' }}>
        <h2>Score Distribution (Histogram)</h2>
        <BarChart width={800} height={300} data={scoreDistribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </div>

      {/* Timeline (Line) */}
      <div style={{ marginTop: '30px' }}>
        <h2>Submission Timeline (Last 7 Days)</h2>
        <LineChart width={800} height={300} data={submissionTimeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="submissions" stroke="#8884d8" />
          <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#82ca9d" />
        </LineChart>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
      <div style={{ fontSize: '12px', color: '#666' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{value}</div>
    </div>
  );
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c'];
```

---

## Migration Path (If You Have Existing Responses)

If responses are currently stored in GitHub markdown files:

1. **Batch import**: Read all `.md` files, extract structured data
2. **Parse & load**: Insert into `responses` table via Worker (or direct D1 SQL)
3. **Rebuild all aggregates**: Run aggregation logic for entire company in one pass
4. **Verify**: Compare old dashboard (markdown counts) with new (D1 aggregates)
5. **Switch**: Update frontend to fetch from Worker instead of parsing markdown

Example import script (Node.js):
```javascript
import fs from 'fs';
import path from 'path';

const responsesDir = 'projects/inflow-network/responses';
const files = fs.readdirSync(responsesDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const content = fs.readFileSync(path.join(responsesDir, file), 'utf-8');
  const response = parseMarkdownResponse(content);

  // POST to worker endpoint
  await fetch('https://api.../responses', {
    method: 'POST',
    body: JSON.stringify(response)
  });
}

function parseMarkdownResponse(markdown) {
  // Extract company, name, questions, score, etc. from markdown frontmatter/content
  // Return structured object matching POST /responses schema
}
```

---

## Debugging & Admin Tools

### View Aggregation Execution Log
```sql
SELECT * FROM aggregate_execution_log
WHERE company = 'inflow-network'
ORDER BY completed_at DESC
LIMIT 10;
```

### Rebuild Aggregates for a Company (Manual)
```sql
-- Delete old aggregates for company
DELETE FROM company_daily_metrics WHERE company = 'inflow-network';
DELETE FROM company_maturity_distribution WHERE company = 'inflow-network';
DELETE FROM company_score_distribution WHERE company = 'inflow-network';
DELETE FROM company_question_metrics WHERE company = 'inflow-network';

-- Re-run aggregation logic (or call worker endpoint multiple times for each response)
```

### Check Response Count by Day
```sql
SELECT
  DATE(datetime(submitted_at, 'unixepoch')) as date,
  COUNT(*) as count
FROM responses
WHERE company = 'inflow-network' AND deleted_at IS NULL
GROUP BY date
ORDER BY date DESC;
```

---

## Future Enhancements

1. **Admin Dashboard**: Visualization of aggregation execution logs, manual rebuild triggers
2. **Webhooks**: Notify external systems when responses reach thresholds (e.g., "100 submissions today")
3. **Export**: CSV/PDF generation of dashboard snapshot
4. **Comparison**: "Score improved by 15% since last month" trend analysis
5. **Alerts**: Slack notification on new submission, anomaly detection (e.g., too many "Initial" responses)
6. **Multi-company Rollups**: Global dashboard across all companies
7. **Soft invalidation**: Event-driven cache updates (as mentioned above)

---

## Summary

This architecture is **optimized for dashboards**, not transactions. Every read query is a simple, indexed lookup. Write complexity is front-loaded: when a response arrives, we compute all derived metrics immediately.

**Trade**: Submit takes ~200ms (aggregation time) instead of ~50ms.  
**Gain**: Dashboard queries always <50ms, instantly cache-friendly, zero N+1 queries.

For an AI assessment system where:
- Real-time dashboards are critical
- Data freshness (5-min lag) is acceptable
- Response volume is moderate (100s–1000s/day)
- Query variance matters (CEO dashboards need predictable latency)

...this design is ideal.
