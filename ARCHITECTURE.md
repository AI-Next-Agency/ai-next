# Architecture: Minimalist Assessment Response System

## Design Principles

1. **Flat schema**: Responses are immutable documents, not relational data
2. **Single table**: All response data in one `responses` row (JSON for questions)
3. **No joins**: Questions fetched separately when detail view needed
4. **Simple queries**: Only filter on indexed columns (company_id, created_at, email)
5. **Immutable writes**: No updates, only inserts; soft deletes via `is_deleted` flag if needed

---

## Data Model

### Entity: Company
**Role**: Static config for each assessment client

| Field | Type | Use |
|-------|------|-----|
| `company_id` | TEXT PK | "acme-corp" - identifier in URLs |
| `name` | TEXT | "ACME Corporation" - display name |
| `slug` | TEXT UNIQUE | URL-safe company identifier |
| `question_count` | INTEGER | Expected submission size (validation) |
| `is_active` | BOOLEAN | Soft delete flag |
| `created_at` | DATETIME | Audit trail |

**Load pattern**: Pre-loaded on every request or cached for 1h (rarely changes)

---

### Entity: Question
**Role**: Static assessment template per company

| Field | Type | Use |
|-------|------|-----|
| `company_id` | TEXT FK | Links to company |
| `question_id` | TEXT | "q1", "q2" - matches submission IDs |
| `title` | TEXT | "Does your org have an AI strategy?" |
| `description` | TEXT | Optional guidance text |
| `order_index` | INTEGER | Display order in form |
| `created_at` | DATETIME | Audit trail |

**Load pattern**: Fetched on-demand in detail endpoint (enriches questions array)

---

### Entity: Response
**Role**: Complete form submission, immutable document

| Field | Type | Use |
|-------|------|-----|
| `response_id` | TEXT PK | "resp_abc123xyz" - globally unique |
| `company_id` | TEXT FK | Which company submitted |
| `name` | TEXT | Respondent name |
| `email` | TEXT | Respondent email (indexed) |
| `department` | TEXT | Org dept (filterable) |
| `role` | TEXT | Job title |
| `ai_maturity_score` | REAL | 0-5 (aggregatable) |
| `maturity_level` | TEXT | "foundation\|emerging\|scaling\|leading" |
| `questions_json` | TEXT | `[{"id":"q1","score":4}, ...]` |
| `metadata_json` | TEXT | `{"userAgent":"...", "ip":"..."}` |
| `created_at` | DATETIME | Submission timestamp |

**Indexes**:
- `(company_id, created_at DESC)` - primary query pattern
- `email` - for duplicate detection
- `(company_id, maturity_level)` - for filtering

---

## API Design

### Request: POST /api/responses
**Purpose**: Ingest form submission  
**Auth**: None (public)  
**Validation**: Company exists, question count matches, email format valid

```json
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
    { "id": "q2", "score": 3 }
  ]
}
```

**Response**:
```json
{
  "ok": true,
  "responseId": "resp_abc123xyz",
  "timestamp": "2026-04-26T14:22:00Z"
}
```

**Error codes**:
- `400 invalid_company` - company_id doesn't exist
- `400 invalid_question_count` - expected N questions, got M
- `400 invalid_email` - email format invalid
- `409 duplicate_submission` - same email in last 24h
- `500 internal_error` - DB write failed

---

### Request: GET /api/responses
**Purpose**: List responses with optional filtering  
**Auth**: Required (Bearer token)

**Query params**:
```
?company=acme-corp
&maturity_level=scaling        (optional)
&department=Engineering         (optional)
&email=alice@acme.com           (optional - exact match)
&limit=50                       (default 20, max 100)
&offset=0                       (pagination)
```

**Response**:
```json
{
  "ok": true,
  "company": "acme-corp",
  "total": 347,
  "limit": 50,
  "offset": 0,
  "count": 50,
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
```

**Query patterns**:
- `?company=acme-corp` - list all for company
- `?company=acme-corp&maturity_level=scaling` - filter by level
- `?company=acme-corp&department=Engineering` - filter by dept
- `?company=acme-corp&email=alice@acme.com` - find one user (ignores pagination)

---

### Request: GET /api/responses/:responseId
**Purpose**: Get single response with question details  
**Auth**: Required (Bearer token)

**Query params**:
```
?company=acme-corp  (required)
```

**Response**:
```json
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
      {
        "id": "q1",
        "title": "Does your org have an AI strategy?",
        "score": 4
      },
      {
        "id": "q2",
        "title": "Do you measure AI ROI?",
        "score": 3
      }
    ]
  }
}
```

---

### Request: GET /api/responses/stats/:company
**Purpose**: Aggregate statistics  
**Auth**: Required (Bearer token)

**Query params**:
```
?department=Engineering  (optional - filter stats)
```

**Response**:
```json
{
  "ok": true,
  "company": "acme-corp",
  "filters": { "department": "Engineering" },
  "stats": {
    "total": 45,
    "avgScore": 3.2,
    "minScore": 1.0,
    "maxScore": 5.0,
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

## Data Flow

### 1. Form Submission Flow
```
[Form Frontend]
       |
       | POST /api/responses
       | { company, name, email, ..., questions: [...] }
       v
[Cloudflare Worker]
       |
       | 1. Validate input shape
       | 2. Check company exists
       | 3. Verify question count
       | 4. Check duplicate email (24h window)
       v
[D1 Database]
       |
       | INSERT INTO responses (...)
       v
[Response]
{ ok: true, responseId: "resp_...", timestamp: "..." }
```

**No transformation**: Data flows directly from form to DB. Validation is light.

---

### 2. Dashboard Query Flow
```
[Dashboard Frontend]
       |
       | GET /api/responses?company=acme-corp&limit=50
       | Authorization: Bearer $API_SECRET
       v
[Cloudflare Worker]
       |
       | 1. Check Authorization header
       | 2. Build WHERE clause from query params
       | 3. Count total
       | 4. Fetch paginated results
       v
[D1 Database]
       |
       | SELECT ... WHERE company_id = ? AND ...
       | ORDER BY created_at DESC
       | LIMIT 50 OFFSET 0
       v
[Response]
{
  ok: true,
  total: 347,
  responses: [ { responseId, name, email, ... }, ... ]
}
```

**Pagination**: Always ordered by `created_at DESC` (newest first)

---

### 3. Detail View Flow
```
[Dashboard Detail View]
       |
       | GET /api/responses/resp_abc123?company=acme-corp
       | Authorization: Bearer $API_SECRET
       v
[Cloudflare Worker]
       |
       | 1. Fetch response row
       | 2. Parse questions_json array
       | 3. Fetch question titles from questions table
       | 4. Enrich questions with titles
       v
[D1 Database]
       |
       | SELECT * FROM responses WHERE response_id = ? AND company_id = ?
       | SELECT title FROM questions WHERE company_id = ? AND question_id IN (...)
       v
[Response]
{
  ok: true,
  response: {
    ...,
    questions: [
      { id: "q1", title: "...", score: 4 },
      ...
    ]
  }
}
```

**Why separate query for titles?**
- Titles rarely change (questions are immutable)
- Separating allows for future caching per question
- Keeps response row size small (no JSON nesting)

---

## Schema Decisions

### Why JSON for questions?
**Pro:**
- Single INSERT, no multi-row complexity
- Fast storage and retrieval
- Matches API request shape

**Con:**
- Can't filter on individual question scores
- Requires app-level parsing

**Workaround**: If you need "all responses where q1 score > 3", compute in app layer or create a materialized view.

---

### Why no question_responses table?
**Traditional approach:**
```sql
responses
├── response_id
├── company_id
├── email
└── ...

response_questions
├── response_id FK
├── question_id FK
└── score
```

**Our approach:**
```sql
responses
├── response_id
├── company_id
├── email
├── questions_json  -- [{"id": "q1", "score": 4}, ...]
└── ...
```

**Why simpler wins:**
- 1 INSERT vs 1+N INSERTs
- 1 SELECT vs JOIN
- Same data, simpler schema
- Tradeoff: can't filter on individual question scores (but rarely needed)

---

### Why immutable responses?
**Current design**: Responses can't be updated or deleted

**Why:**
- Assessment submissions should be tamper-proof (audit trail)
- Simplifies schema (no update_at, no transaction isolation)
- Reduces concurrency complexity

**If you need to correct a response:**
1. Keep original response (immutable)
2. Create a new response with corrected data
3. Tag original with `is_deleted = true` and link to corrected_by_response_id

---

## Performance Characteristics

### Write Performance
| Scenario | Time | Bottleneck |
|----------|------|-----------|
| Single submission | ~100ms | D1 write + validation |
| 100 concurrent | ~5s total | D1 serialization (SQLite) |

**Improvement at scale**: Use batch endpoint for bulk submissions.

---

### Read Performance
| Query | Rows | Time | Index |
|-------|------|------|-------|
| List by company | 100 | ~10ms | (company_id, created_at) |
| Filter by dept | 50 | ~15ms | (company_id, department) |
| Single response | 1 | ~5ms | (response_id) |
| Stats aggregate | 1 | ~20ms | (company_id, maturity_level) |

**Scaling point**: At 100k responses/company, consider caching stats endpoint.

---

## Security Model

### Authentication
- `POST /api/responses`: **No auth** (public form submission)
- `GET /api/responses*`: **Bearer token** (API_SECRET) required
- Token stored in Cloudflare secret, not in code

### Authorization
- No fine-grained permissions (single company per request)
- All authenticated users see all companies
- Upgrade to multi-tenant auth if needed (add company ACL to token)

### Data Privacy
- Responses stored in plaintext (no encryption at rest)
- IP + User-Agent captured in metadata (for fraud detection)
- Consider GDPR: implement data deletion on request

---

## Monitoring & Alerts

### Key Metrics
1. **Response time**: POST /api/responses should be < 200ms
2. **Error rate**: Should be < 0.1% (validation errors expected)
3. **Database size**: Monitor D1 usage (max 10 GB)
4. **Duplicate rate**: Track 409 errors (duplicate emails)

### Sample Logging
```typescript
// In worker middleware
c.env.DB.prepare('INSERT INTO request_logs ...')
  .bind(c.req.method, c.req.path, responseTime, statusCode)
  .run();
```

### Cloudflare Dashboard
- Workers > Metrics: request count, errors, latency
- D1: database size, query count

---

## Cost Model (Cloudflare)

| Component | Free | Pro/Biz |
|-----------|------|---------|
| Workers (1M req) | Included | $0.50 |
| D1 storage | Included | Included |
| D1 compute | Included | ~$0.01–0.10 per 1M ops |

**Typical costs:**
- 10k submissions/month: $0 (free tier)
- 100k submissions/month: $5–10
- 1M submissions/month: $50–100

---

## Migration Path (Future)

### Phase 1: Current (< 100k responses/company)
- SQLite on D1
- All reads from live DB

### Phase 2: Medium (100k–1M)
- Keep D1 as source
- Cache stats endpoint (compute nightly)
- Archive old responses to R2

### Phase 3: Large (> 1M)
- Partition responses by year
- Dedicated analytics table (materialized nightly)
- Cold storage (R2) for archive

---

## Rollback Plan

**If something breaks:**
1. Stop accepting submissions (change API route)
2. Restore from last backup (`wrangler d1 execute ... --file backup.sql`)
3. Redeploy worker with fix
4. Resume submissions

**Time to recover**: ~5 minutes (assuming backup exists)

---

## Summary: Why This Design?

| Goal | Solution |
|------|----------|
| Minimize complexity | Flat schema, immutable writes |
| Fast ingestion | Single INSERT, no joins |
| Easy filtering | Indexed columns only |
| Low operational overhead | 3 tables, no migrations needed |
| Audit trail | Immutable responses + metadata |
| Multi-tenant | Company ID partitioning |

**The constraint is the strength**: By refusing to support complex aggregations and updates, we gain simplicity and reliability.
