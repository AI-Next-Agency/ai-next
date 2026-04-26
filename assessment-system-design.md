# Minimalist AI Assessment Form System

## Design Philosophy

**One principle**: A response is a flat document. Store it whole, query it surgically. No joins, no normalization beyond what enables filtering and aggregation.

---

## 1. D1 Schema (3 tables, ~40 lines SQL)

```sql
-- Companies: Static, pre-loaded. One row per client.
CREATE TABLE companies (
  company_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  question_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questions: Static, pre-loaded. Immutable reference data.
CREATE TABLE questions (
  company_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, question_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Responses: The entire submission as one row.
-- Denormalized for speed, indexed for filtering.
CREATE TABLE responses (
  response_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  ai_maturity_score REAL NOT NULL,
  maturity_level TEXT NOT NULL,
  questions_json TEXT NOT NULL,  -- entire [{"id":"...", "score":4}, ...] array
  metadata_json TEXT,             -- { "user_agent": "...", "ip": "...", ... }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Index for most common queries
CREATE INDEX idx_responses_company_created ON responses(company_id, created_at DESC);
CREATE INDEX idx_responses_email ON responses(email);
```

**Why this shape:**
- `questions_json` stores `[{id, score}, {id, score}, ...]` exactly as received.
- One insert = done. No multi-row inserts, no transaction complexity.
- `maturity_level` is denormalized (calculated from `ai_maturity_score`) for instant filtering.
- No `question_responses` table. Query logic extracts the array; DB just stores it.

---

## 2. Worker Endpoint Signatures

### Receive a response
```
POST /api/responses
Content-Type: application/json

Request body:
{
  "company": "acme-corp",
  "name": "Alice Smith",
  "email": "alice@acme.com",
  "department": "Engineering",
  "role": "Senior Engineer",
  "aiMaturityScore": 3.5,
  "maturityLevel": "scaling",
  "questions": [
    { "id": "q1", "score": 4 },
    { "id": "q2", "score": 3 },
    { "id": "q3", "score": 5 }
  ]
}

Response: 201 Created
{
  "ok": true,
  "responseId": "resp_abc123xyz",
  "timestamp": "2026-04-26T14:22:00Z"
}

Error responses:
400: { "ok": false, "error": "invalid_company" }
400: { "ok": false, "error": "missing_required_field", "field": "email" }
400: { "ok": false, "error": "invalid_question_count" }
409: { "ok": false, "error": "duplicate_email_in_window" }
500: { "ok": false, "error": "database_error" }
```

### Query responses (dashboard)
```
GET /api/responses?company=acme-corp&limit=50&offset=0

Query params:
  company: required
  maturity_level: optional (scaling, emerging, foundation, etc.)
  department: optional (filter by department)
  limit: optional, default 20, max 100
  offset: optional, default 0
  email: optional (exact match for single user)

Response: 200 OK
{
  "ok": true,
  "company": "acme-corp",
  "total": 347,
  "limit": 50,
  "offset": 0,
  "responses": [
    {
      "responseId": "resp_abc123",
      "name": "Alice Smith",
      "email": "alice@acme.com",
      "department": "Engineering",
      "role": "Senior Engineer",
      "aiMaturityScore": 3.5,
      "maturityLevel": "scaling",
      "submittedAt": "2026-04-25T10:30:00Z"
    },
    ...
  ]
}

Error:
401: { "ok": false, "error": "unauthorized" }
400: { "ok": false, "error": "company_not_found" }
```

### Get single response (with question details)
```
GET /api/responses/:responseId?company=acme-corp

Response: 200 OK
{
  "ok": true,
  "response": {
    "responseId": "resp_abc123",
    "company": "acme-corp",
    "name": "Alice Smith",
    "email": "alice@acme.com",
    "department": "Engineering",
    "role": "Senior Engineer",
    "aiMaturityScore": 3.5,
    "maturityLevel": "scaling",
    "submittedAt": "2026-04-25T10:30:00Z",
    "questions": [
      { "id": "q1", "title": "Does your org have an AI strategy?", "score": 4 },
      { "id": "q2", "title": "Do you measure AI ROI?", "score": 3 },
      { "id": "q3", "title": "Does your team have AI skills training?", "score": 5 }
    ]
  }
}
```

### Aggregate stats (minimal)
```
GET /api/responses/stats/:company?department=Engineering

Response: 200 OK
{
  "ok": true,
  "company": "acme-corp",
  "filters": { "department": "Engineering" },
  "stats": {
    "total": 45,
    "avgScore": 3.2,
    "distribution": {
      "foundation": 8,
      "emerging": 18,
      "scaling": 15,
      "leading": 4
    }
  }
}
```

---

## 3. Worker Code (Hono + D1)

### Entry point (index.ts)

```typescript
import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';
import { v4 as uuidv4 } from 'uuid';

interface Env {
  DB: D1Database;
  COMPANY_SECRET: string;  // e.g., ?secret=xyz to prevent spam
}

const app = new Hono<{ Bindings: Env }>();

// Middleware: validate company exists in cache or DB
app.use(async (c, next) => {
  c.set('companyCache', new Map());
  await next();
});

// POST /api/responses
app.post('/api/responses', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  // 1. Validate input shape
  const validation = validateSubmission(body);
  if (!validation.ok) {
    return c.json({ ok: false, error: validation.error }, 400);
  }

  const {
    company,
    name,
    email,
    department,
    role,
    aiMaturityScore,
    maturityLevel,
    questions,
  } = body;

  // 2. Verify company exists
  const companyRow = await db
    .prepare('SELECT company_id, question_count FROM companies WHERE company_id = ?')
    .bind(company)
    .first();

  if (!companyRow) {
    return c.json({ ok: false, error: 'invalid_company' }, 400);
  }

  // 3. Validate question count
  if (questions.length !== companyRow.question_count) {
    return c.json(
      { ok: false, error: 'invalid_question_count', expected: companyRow.question_count },
      400
    );
  }

  // 4. Check for duplicate email in last 24h (optional—prevents accidental re-submissions)
  const recent = await db
    .prepare(
      `SELECT response_id FROM responses 
       WHERE company_id = ? AND email = ? AND created_at > datetime('now', '-24 hours')
       LIMIT 1`
    )
    .bind(company, email)
    .first();

  if (recent) {
    return c.json(
      { ok: false, error: 'duplicate_email_in_window', message: 'Already submitted in the last 24h' },
      409
    );
  }

  // 5. Insert response
  const responseId = `resp_${uuidv4().slice(0, 12)}`;
  const questionsJson = JSON.stringify(questions);
  const metadataJson = JSON.stringify({
    userAgent: c.req.headers.get('user-agent'),
    ip: c.req.headers.get('cf-connecting-ip'),
  });

  try {
    await db
      .prepare(
        `INSERT INTO responses 
         (response_id, company_id, name, email, department, role, ai_maturity_score, maturity_level, questions_json, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        responseId,
        company,
        name,
        email,
        department,
        role,
        aiMaturityScore,
        maturityLevel,
        questionsJson,
        metadataJson
      )
      .run();

    return c.json(
      {
        ok: true,
        responseId,
        timestamp: new Date().toISOString(),
      },
      201
    );
  } catch (err) {
    console.error('DB insert error:', err);
    return c.json({ ok: false, error: 'database_error' }, 500);
  }
});

// GET /api/responses?company=...
app.get('/api/responses', async (c) => {
  const db = c.env.DB;
  const company = c.req.query('company');
  const maturityLevel = c.req.query('maturity_level');
  const department = c.req.query('department');
  const email = c.req.query('email');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');

  if (!company) {
    return c.json({ ok: false, error: 'company_required' }, 400);
  }

  // Verify company exists
  const companyExists = await db
    .prepare('SELECT 1 FROM companies WHERE company_id = ?')
    .bind(company)
    .first();

  if (!companyExists) {
    return c.json({ ok: false, error: 'company_not_found' }, 400);
  }

  // Build dynamic WHERE clause
  let whereClause = 'WHERE company_id = ?';
  const params: any[] = [company];

  if (maturityLevel) {
    whereClause += ' AND maturity_level = ?';
    params.push(maturityLevel);
  }

  if (department) {
    whereClause += ' AND department = ?';
    params.push(department);
  }

  if (email) {
    whereClause += ' AND email = ?';
    params.push(email);
    // If email specified, ignore limit/offset—return exact match
  }

  // Count total
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM responses ${whereClause}`)
    .bind(...params)
    .first<{ total: number }>();

  const total = countResult?.total || 0;

  // Fetch paginated results
  let query = `SELECT 
    response_id, name, email, department, role, 
    ai_maturity_score, maturity_level, created_at
    FROM responses ${whereClause}
    ORDER BY created_at DESC`;

  if (!email) {
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
  }

  const rows = await db.prepare(query).bind(...params).all<any>();

  return c.json({
    ok: true,
    company,
    total,
    limit,
    offset,
    responses: rows.results.map((r) => ({
      responseId: r.response_id,
      name: r.name,
      email: r.email,
      department: r.department,
      role: r.role,
      aiMaturityScore: r.ai_maturity_score,
      maturityLevel: r.maturity_level,
      submittedAt: r.created_at,
    })),
  });
});

// GET /api/responses/:responseId?company=...
app.get('/api/responses/:responseId', async (c) => {
  const db = c.env.DB;
  const responseId = c.req.param('responseId');
  const company = c.req.query('company');

  if (!company) {
    return c.json({ ok: false, error: 'company_required' }, 400);
  }

  const row = await db
    .prepare(
      `SELECT * FROM responses WHERE response_id = ? AND company_id = ?`
    )
    .bind(responseId, company)
    .first<any>();

  if (!row) {
    return c.json({ ok: false, error: 'not_found' }, 404);
  }

  // Fetch question titles to enrich response
  const questions = JSON.parse(row.questions_json);
  const questionDetails = await db
    .prepare(
      `SELECT question_id, title FROM questions WHERE company_id = ? AND question_id IN (${questions.map(() => '?').join(',')})`
    )
    .bind(company, ...questions.map((q: any) => q.id))
    .all<any>();

  const titleMap = new Map(questionDetails.results.map((q: any) => [q.question_id, q.title]));

  return c.json({
    ok: true,
    response: {
      responseId: row.response_id,
      company: row.company_id,
      name: row.name,
      email: row.email,
      department: row.department,
      role: row.role,
      aiMaturityScore: row.ai_maturity_score,
      maturityLevel: row.maturity_level,
      submittedAt: row.created_at,
      questions: questions.map((q: any) => ({
        id: q.id,
        title: titleMap.get(q.id) || '(unknown)',
        score: q.score,
      })),
    },
  });
});

// GET /api/responses/stats/:company
app.get('/api/responses/stats/:company', async (c) => {
  const db = c.env.DB;
  const company = c.req.param('company');
  const department = c.req.query('department');

  let whereClause = 'WHERE company_id = ?';
  const params: any[] = [company];

  if (department) {
    whereClause += ' AND department = ?';
    params.push(department);
  }

  const stats = await db
    .prepare(
      `SELECT 
        COUNT(*) as total,
        AVG(ai_maturity_score) as avg_score,
        maturity_level,
        COUNT(*) as count
      FROM responses ${whereClause}
      GROUP BY maturity_level
      ORDER BY maturity_level`
    )
    .bind(...params)
    .all<any>();

  const distribution: Record<string, number> = {};
  let total = 0;
  let avgScore = 0;

  stats.results.forEach((row: any) => {
    distribution[row.maturity_level] = row.count;
    total = row.total;
    avgScore = row.avg_score;
  });

  return c.json({
    ok: true,
    company,
    filters: department ? { department } : {},
    stats: {
      total,
      avgScore: Math.round(avgScore * 100) / 100,
      distribution,
    },
  });
});

export default app;

// Validation
function validateSubmission(body: any) {
  const required = ['company', 'name', 'email', 'department', 'role', 'aiMaturityScore', 'maturityLevel', 'questions'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return { ok: false, error: 'missing_required_field', field };
    }
  }

  if (!Array.isArray(body.questions)) {
    return { ok: false, error: 'questions_must_be_array' };
  }

  if (body.aiMaturityScore < 0 || body.aiMaturityScore > 5) {
    return { ok: false, error: 'ai_maturity_score_out_of_range' };
  }

  if (!body.email.includes('@')) {
    return { ok: false, error: 'invalid_email' };
  }

  return { ok: true };
}
```

---

## 4. Example Usage: Dashboard Query

```typescript
// Dashboard.tsx — fetch and display responses
async function loadResponses(companyId: string) {
  const res = await fetch(
    `/api/responses?company=${companyId}&limit=50&offset=0`
  );
  const data = await res.json();

  if (!data.ok) {
    console.error(data.error);
    return;
  }

  // data.responses = [ { responseId, name, email, aiMaturityScore, ... }, ... ]
  return data.responses;
}

// Single response detail view
async function loadResponseDetail(responseId: string, companyId: string) {
  const res = await fetch(
    `/api/responses/${responseId}?company=${companyId}`
  );
  const data = await res.json();

  // data.response.questions = [{ id, title, score }, ...]
  return data.response;
}

// Stats widget
async function loadStats(companyId: string, department?: string) {
  const url = `/api/responses/stats/${companyId}` +
    (department ? `?department=${department}` : '');
  const res = await fetch(url);
  const data = await res.json();

  // data.stats = { total, avgScore, distribution: { foundation: 10, ... } }
  return data.stats;
}
```

---

## 5. Hidden Complexity (What the System Handles)

### What's simple:
- ✅ Single-row insert, no multi-statement transactions
- ✅ Flat schema = predictable query performance
- ✅ No question-response joins needed for bulk operations

### What's pushed to the application layer:
- **Validation**: Email format, score ranges, question count—all checked before DB insert
- **Deduplication**: Duplicate email check is *application-level* (24-hour window), not DB-enforced
- **Concurrency**: D1 is SQLite; writes are serialized per table. For high volume, consider a batch endpoint
- **Auth/Permissions**: Not in the schema. Assume: Worker validates via secret or JWT before accepting requests
- **Filtering complexity**: If you need "responses where avg(score) > 3.5", compute in application after fetch. DB is for simple WHERE clauses
- **Soft deletes**: Not supported. If you need to retract, add an `is_deleted` boolean and filter in queries

---

## 6. Dependency Strategy: Company Configs & Questions

### Static loading pattern (at Worker startup):
```typescript
// wrangler.toml
[env.production]
vars = { COMPANY_CONFIG_JSON = "..." }

// In worker
const COMPANY_CONFIG = JSON.parse(c.env.COMPANY_CONFIG_JSON);
// Pre-computed list: { "acme-corp": { "name": "...", "question_count": 3 }, ... }
```

**OR** cache from D1 on first request:
```typescript
// On first /api/responses POST with a new company
const companyCache = new Map();
const company = await db
  .prepare('SELECT * FROM companies WHERE company_id = ?')
  .bind(companyId)
  .first();

if (!company) throw new Error('invalid_company');
companyCache.set(companyId, company);
```

### Questions: Load-on-demand in the detail endpoint

```typescript
// GET /api/responses/:responseId fetches:
const questions = await db
  .prepare('SELECT * FROM questions WHERE company_id = ?')
  .bind(company)
  .all();
// Enrich the response
```

**Why not cache questions?**
- They rarely change per company
- If they do, you'd need invalidation logic
- Simpler: DB query is fast for small datasets (< 50 questions/company)
- Use HTTP caching headers (`Cache-Control: max-age=3600`) for the entire detail endpoint

### Company onboarding:
1. Admin creates row in `companies` table (via Supabase UI or migration script)
2. Admin creates rows in `questions` table (bulk INSERT or CSV import)
3. Worker can immediately start accepting responses for that company
4. No application restart needed

---

## 7. Scaling Notes

**At what volume does this break?**

- **< 10k responses/company**: No problem. Current schema handles this comfortably.
- **10k–100k**: Still fine. Index on `(company_id, created_at)` keeps queries fast.
- **100k+**: Consider partitioning by year or adding a separate analytics table (nightly aggregation of stats).

**If you hit limits:**
1. Keep the responses table as-is (immutable store)
2. Create a separate `response_summaries` table (company_id, date, maturity_level, count) updated nightly
3. Serve dashboard stats from summaries, not raw responses

**Batch ingestion:**
```typescript
POST /api/responses/batch
{
  "company": "acme-corp",
  "responses": [ {...}, {...}, {...} ]
}
```
Insert all at once in a transaction. D1 supports batching.

---

## 8. Example: Setting Up a New Client

```bash
# 1. Add company
INSERT INTO companies (company_id, name, slug, question_count)
VALUES ('acme-corp', 'ACME Corp', 'acme-corp', 8);

# 2. Add questions (one INSERT per question or bulk)
INSERT INTO questions (company_id, question_id, title)
VALUES 
  ('acme-corp', 'q1', 'Does your organization have a documented AI strategy?'),
  ('acme-corp', 'q2', 'Do you measure ROI on AI investments?'),
  ...
  ('acme-corp', 'q8', 'Does your executive leadership have AI literacy?');

# 3. Worker is ready to accept responses
# POST /api/responses with company='acme-corp'
```

---

## Summary

**The system is intentionally simple because:**
1. Responses are **immutable**: no updates, only inserts
2. Schema is **flat**: questions stored as JSON, no joins
3. Queries are **direct**: company + filters, no aggregations on raw data
4. Scale is **practical**: < 100k responses/company before needing optimization

**Three endpoints, one database table pattern:**
- `POST /api/responses` — ingest
- `GET /api/responses` — list & filter
- `GET /api/responses/:id` — detail

Everything else (dashboards, reports, exports) queries these endpoints and shapes the data in the frontend.
