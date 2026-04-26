# Architecture Diagrams - Response Storage & Query Layer

Visual representations of the system architecture.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│  (Web forms, mobile apps, integrations, dashboards)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    POST /api/companies/:id/responses
                    GET  /api/companies/:id/responses
                    GET  /api/companies/:id/analytics
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKER (TypeScript)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Validation  │  │   Auth/CORS  │  │   Routing    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│           ↓               ↓                 ↓                    │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Request Handlers (Companies, Questions, Response) │          │
│  │  - Create, Read, Update operations                 │          │
│  │  - Advanced filtering & aggregation                │          │
│  │  - Audit logging                                   │          │
│  └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┬─────────────────────┐
        ↓                     ↓                     ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  D1 Database │      │  R2 Storage  │      │  KV Cache    │
│  (SQLite)    │      │  (Backups)   │      │  (Optional)  │
│              │      │              │      │              │
│  ┌─────────┐ │      └──────────────┘      └──────────────┘
│  │Companies│ │
│  │Question │ │
│  │Responses│ │
│  │Answers  │ │
│  │Webhooks │ │
│  │AuditLog │ │
│  └─────────┘ │
└──────────────┘
        ↓
┌──────────────────────────────┐
│  External Integrations       │
│  - Webhooks (Slack, email)   │
│  - Analytics platforms       │
│  - Data warehouses           │
└──────────────────────────────┘
```

---

## 2. Data Model Relationships

```
┌────────────────┐
│   COMPANIES    │ (Multi-tenant SaaS)
├────────────────┤
│ id (PK)        │
│ slug (UNIQUE)  │
│ name           │
│ config (JSONB) │ ← Custom branding, webhooks
└────────────────┘
       │
       │ 1-to-many
       ↓
┌──────────────────────┐
│   QUESTION_SETS      │ (Versioned schemas)
├──────────────────────┤
│ id (PK)              │
│ company_id (FK)      │
│ version              │
│ name                 │
│ metadata (JSONB)     │ ← Scoring rules
└──────────────────────┘
       │
       │ 1-to-many
       ↓
┌──────────────────────┐
│    QUESTIONS         │ (Immutable per version)
├──────────────────────┤
│ id (PK)              │
│ question_set_id (FK) │
│ external_id          │
│ question_text        │
│ scale_min/max        │
│ category             │
│ metadata (JSONB)     │ ← Weights, conditions
└──────────────────────┘
       ↑
       │ 1-to-many
       │
┌──────────────────────┐
│    RESPONSES         │ (One per submission)
├──────────────────────┤
│ id (PK)              │
│ company_id (FK)      │
│ question_set_id (FK) │
│ respondent_name      │
│ respondent_email     │
│ average_score        │ ← Denormalized for speed
│ maturity_level       │
│ metadata (JSONB)     │ ← IP, user agent, etc.
│ custom_fields (JSONB)│ ← Company-specific
└──────────────────────┘
       │
       │ 1-to-many
       ↓
┌──────────────────────┐
│     ANSWERS          │ (Normalized detail)
├──────────────────────┤
│ id (PK)              │
│ response_id (FK)     │
│ question_id (FK)     │
│ score                │
│ text_answer          │
└──────────────────────┘
```

---

## 3. Request Flow: POST /responses (Happy Path)

```
START: Client submits form
  │
  ├─→ [1] HTTP Request arrives at Worker
  │   POST /api/companies/abc/responses
  │   { name, email, department, questions: [{id, score}] }
  │
  ├─→ [2] Input Validation Layer
  │   • Check required fields (name, email)
  │   • Validate email format
  │   • Validate score ranges (0-100)
  │   • Validate maturity_level enum
  │   ✓ Validation passes
  │
  ├─→ [3] Database Lookups (Preparation)
  │   • Query: GET companies WHERE id=abc AND active=1
  │   ✓ Company found
  │   • Query: GET question_sets WHERE company_id=abc AND active=1
  │   ✓ Latest version found (v2)
  │   • Query: GET questions WHERE question_set_id=qs123
  │   ✓ All questions fetched (3 questions)
  │
  ├─→ [4] Cross-Validation
  │   • Client sent q1, q2, q3 scores
  │   • Question set has q1, q2, q3
  │   • All question IDs match ✓
  │   • All scores in range (1-5) ✓
  │
  ├─→ [5] Compute Derived Metrics
  │   • scores = [4, 3, 4]
  │   • average = 3.67
  │   • min = 3
  │   • max = 4
  │
  ├─→ [6] Insert to Database (Transaction)
  │   │
  │   ├─ INSERT responses (resp123, abc, qs123, ...)
  │   │  → 1 row inserted
  │   │
  │   ├─ INSERT answers (ans1, resp123, q1, 4)
  │   │  → 1 row inserted
  │   │
  │   ├─ INSERT answers (ans2, resp123, q2, 3)
  │   │  → 1 row inserted
  │   │
  │   ├─ INSERT answers (ans3, resp123, q3, 4)
  │   │  → 1 row inserted
  │   │
  │   └─ Commit transaction ✓
  │
  ├─→ [7] Audit Trail
  │   INSERT audit_log (id, entity_type='response', action='create', ...)
  │   ✓ Mutation logged
  │
  ├─→ [8] Trigger Webhooks (Fire & Forget)
  │   • Query: GET webhooks WHERE company_id=abc AND event_type='response.created'
  │   • Found: Slack webhook, email webhook
  │   • POST to Slack webhook: { event, response_id, average_score, timestamp }
  │   • POST to email webhook: same
  │   ✓ Both started (don't wait for response)
  │
  ├─→ [9] Format Response
  │   {
  │     "id": "resp123",
  │     "company_id": "abc",
  │     "created_at": "2026-04-26T10:10:00Z",
  │     "average_score": 3.67,
  │     "total_questions": 3,
  │     "status": "submitted"
  │   }
  │
  └─→ [10] Return 201 Created
      Response sent to client
      Total latency: 50-100ms
```

---

## 4. Query Flow: GET /responses (With Filters)

```
START: Client requests filtered responses
  │
  ├─→ [1] Parse Query Parameters
  │   ?dateFrom=2026-01-01&dateTo=2026-04-30
  │   &scoreMin=3&scoreMax=5
  │   &department=Engineering
  │   &limit=10&offset=0
  │   &sortBy=created_at&sortOrder=desc
  │
  ├─→ [2] Build Dynamic WHERE Clause
  │   Base: WHERE company_id = 'abc'
  │   Add: AND created_at >= '2026-01-01'
  │   Add: AND created_at <= '2026-04-30'
  │   Add: AND average_score >= 3.0
  │   Add: AND average_score <= 5.0
  │   Add: AND respondent_department = 'Engineering'
  │   Add: ORDER BY created_at DESC
  │   Add: LIMIT 10 OFFSET 0
  │
  ├─→ [3] Indexes Help! (Strategic index selection)
  │   Query uses: idx_responses_company (company_id, created_at)
  │   Then filters on: average_score (idx_responses_avg_score)
  │   Result: O(log n) instead of O(n)
  │   Estimated cost: 30-50ms for 10k records
  │
  ├─→ [4] Execute SELECT
  │   Query: 10 rows matching all criteria
  │   Each row contains: id, name, email, department, average_score, etc.
  │
  ├─→ [5] Execute COUNT Query (Parallel)
  │   Same WHERE clause as above
  │   Returns: total=127
  │   (Used for pagination)
  │
  ├─→ [6] Format Response
  │   {
  │     "total": 127,
  │     "limit": 10,
  │     "offset": 0,
  │     "has_more": true,
  │     "data": [
  │       {
  │         "id": "resp1",
  │         "respondent_name": "Alice",
  │         "average_score": 4.2,
  │         "maturity_level": "advanced",
  │         "created_at": "2026-04-26T..."
  │       },
  │       ...9 more rows...
  │     ],
  │     "filters": {
  │       "dateFrom": "2026-01-01",
  │       "dateTo": "2026-04-30",
  │       "scoreMin": 3,
  │       "department": "Engineering"
  │     }
  │   }
  │
  └─→ [7] Return 200 OK
      Response sent to client
      Total latency: 30-100ms (depending on record count and filters)
```

---

## 5. Analytics Aggregation Pipeline

```
Request: GET /api/companies/abc/analytics?dateFrom=2026-01-01&dateTo=2026-12-31
  │
  ├─→ [1] Summary Statistics Query
  │   SELECT COUNT(*), AVG(average_score), MIN(average_score), MAX(average_score)
  │   WHERE company_id='abc' AND created_at BETWEEN dates
  │   Result:
  │   {
  │     "total_responses": 127,
  │     "mean_score": 3.42,
  │     "min_score": 1.5,
  │     "max_score": 5.0
  │   }
  │
  ├─→ [2] Score Distribution Query
  │   SELECT
  │     CASE WHEN average_score < 2 THEN '1.0-2.0' ... END as bucket,
  │     COUNT(*) as count
  │   GROUP BY bucket
  │   Result:
  │   [
  │     { "bucket": "1.0-2.0", "count": 12 },
  │     { "bucket": "2.0-3.0", "count": 35 },
  │     { "bucket": "3.0-4.0", "count": 45 },
  │     { "bucket": "4.0-5.0", "count": 35 }
  │   ]
  │
  ├─→ [3] Maturity Level Breakdown Query
  │   SELECT maturity_level, COUNT(*), AVG(average_score)
  │   GROUP BY maturity_level
  │   Result:
  │   [
  │     { "maturity_level": "intermediate", "count": 65, "avg_score": 3.52 },
  │     { "maturity_level": "beginner", "count": 45, "avg_score": 2.89 },
  │     { "maturity_level": "advanced", "count": 17, "avg_score": 4.31 }
  │   ]
  │
  ├─→ [4] Department Breakdown Query
  │   SELECT respondent_department, COUNT(*), AVG(average_score)
  │   WHERE respondent_department IS NOT NULL
  │   GROUP BY respondent_department
  │   Result:
  │   [
  │     { "department": "Engineering", "count": 52, "avg_score": 3.89 },
  │     { "department": "Product", "count": 35, "avg_score": 3.12 },
  │     { "department": "Marketing", "count": 28, "avg_score": 2.76 },
  │     { "department": "Sales", "count": 12, "avg_score": 2.33 }
  │   ]
  │
  └─→ [5] Combine & Return
      Response contains all 4 aggregations
      Latency: 100-200ms for 10k records
```

---

## 6. Indexing Strategy Visualization

```
RESPONSES TABLE (10,000 rows)
┌──────────────────────────────────────────────────────────────┐

WITHOUT INDEXES (FULL TABLE SCAN):
  SELECT * WHERE company_id='abc' AND average_score >= 3.5
  Rows examined: ALL 10,000 ✗ SLOW (50-200ms)

WITH INDEXES:
  ┌─────────────────────────────────────────────────────────┐
  │ INDEX: idx_responses_company (company_id, created_at)  │
  │                                                         │
  │ company_id='abc' → 200 candidate rows ✓ FAST (1-5ms)   │
  │   ├─ created_at DESC ordering BONUS ✓                  │
  │   └─ can paginate efficiently BONUS ✓                  │
  └─────────────────────────────────────────────────────────┘
            ↓
  Filter: average_score >= 3.5 → 120 results ✓

TOTAL: 30-50ms vs. 50-200ms (2-5x faster)

FOR SCORE-BASED QUERIES:
  ┌──────────────────────────────────────────────────────────┐
  │ INDEX: idx_responses_avg_score (company_id, average_score) │
  │                                                           │
  │ company_id='abc' AND average_score >= 3.5                │
  │ → Uses both parts of index → VERY FAST ✓ (5-20ms)       │
  └──────────────────────────────────────────────────────────┘

COMPOSITE INDEXES COVER THESE PATTERNS:
  • Filter by company + date range
  • Filter by company + score range
  • Sort by created_at or score
  • Paginate efficiently

NO INDEXES NEEDED FOR:
  • Specific response_id lookup (PRIMARY KEY)
  • Email search (single column index exists)
```

---

## 7. Versioning & Historical Data Preservation

```
Timeline:

2026-01-01: Company ACME launches with Assessment v1
  Question set: v1
  ├─ Question 1: "AI Tools familiarity"
  ├─ Question 2: "Code generation usage"
  └─ Question 3: "Prompt engineering"

  Responses 1-100 submitted → linked to question_set v1
  ✓ All responses show v1 questions

2026-03-01: ACME needs to update questions
  Create Question set: v2 (new version, v1 stays intact)
  ├─ Question 1: "AI Tools familiarity" (SAME)
  ├─ Question 2: "Code generation usage" (SAME)
  ├─ Question 3: "Prompt engineering" (SAME)
  └─ Question 4: "Data privacy understanding" (NEW)

  Responses 101-150 submitted → linked to question_set v2
  ✓ New responses have 4 questions
  ✓ Old responses still have 3 questions
  ✓ Can compare both groups accurately

2026-04-01: ACME wants to deep-dive on specific topics
  Create Question set: v3
  ├─ Question 1: "Basic AI knowledge" (REWORDING)
  ├─ Question 2: "Hands-on tool experience"
  ├─ Question 3: "Team upskilling capability"
  └─ Question 4: "Change management readiness" (ENTIRELY NEW)

  Responses 151-180 submitted → linked to question_set v3
  ✓ Full history preserved
  ✓ All responses queryable by version
  ✓ No data loss or migration needed

QUERIES OVER TIME:
  "Trending AI tools familiarity" → Uses v1, v2, v3 data with caveats
  "How did we improve?" → Compare v1 vs v3
  "Original baseline" → Isolate v1-only responses
```

---

## 8. Data Flow: Multiple Companies

```
┌─────────────────────────────────────────────────────────────┐
│                        API Requests                          │
└─────────────────────────────────────────────────────────────┘
        │               │               │
        ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Company A  │  │   Company B  │  │   Company C  │
│  (acme-corp) │  │  (techco)    │  │  (startup)   │
└──────────────┘  └──────────────┘  └──────────────┘
        │               │               │
        ↓               ↓               ↓
   Questions        Questions        Questions
   Set v1           Set v2           Set v1
   Q1-3             Q1-5             Q1-3
   100 resp         250 resp         40 resp
        │               │               │
        └───────────────┼───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   SHARED DATABASE (D1)        │
        │                               │
        │  companies table              │
        │  ├─ Company A id:abc          │
        │  ├─ Company B id:def          │
        │  └─ Company C id:ghi          │
        │                               │
        │  question_sets table          │
        │  ├─ A's questions (v1)        │
        │  ├─ B's questions (v1,v2)     │
        │  └─ C's questions (v1)        │
        │                               │
        │  responses table              │
        │  ├─ 100 from A               │
        │  ├─ 250 from B               │
        │  └─ 40 from C                │
        │                               │
        │  All isolated by company_id!  │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │   QUERY ISOLATION             │
        │                               │
        │  GET A's responses:           │
        │   WHERE company_id='abc'      │
        │   → 100 rows only ✓           │
        │                               │
        │  GET B's analytics:           │
        │   WHERE company_id='def'      │
        │   → 250 rows aggregated ✓     │
        │                               │
        │  GET C's responses:           │
        │   WHERE company_id='ghi'      │
        │   → 40 rows only ✓            │
        │                               │
        │  Cross-contamination: 0% ✓   │
        └───────────────────────────────┘
```

---

## 9. Error Handling Flow

```
Request arrives
    │
    ├─→ [Validation Error]
    │   ├─ Missing required field
    │   ├─ Invalid email format
    │   ├─ Score out of range
    │   └─→ HTTP 400
    │       {
    │         "error": "VALIDATION_ERROR",
    │         "details": { "field": "error message" }
    │       }
    │
    ├─→ [Company Not Found]
    │   ├─ Company doesn't exist
    │   ├─ Company is inactive
    │   └─→ HTTP 404
    │       {
    │         "error": "COMPANY_NOT_FOUND",
    │         "details": { "company_id": "Company not found or inactive" }
    │       }
    │
    ├─→ [No Question Set]
    │   ├─ Company exists but has no questions configured
    │   └─→ HTTP 400
    │       {
    │         "error": "NO_QUESTION_SET",
    │         "details": { "question_set": "..." }
    │       }
    │
    ├─→ [Invalid Question]
    │   ├─ Client submitted question ID not in active set
    │   └─→ HTTP 400
    │       {
    │         "error": "INVALID_QUESTION",
    │         "details": { "questions": "Unknown question: q99" }
    │       }
    │
    ├─→ [Invalid Score]
    │   ├─ Score outside question's scale range
    │   └─→ HTTP 400
    │       {
    │         "error": "INVALID_SCORE",
    │         "details": { "score": "Score out of range" }
    │       }
    │
    └─→ [Internal Error]
        ├─ Database connection lost
        ├─ Unexpected exception
        └─→ HTTP 500
            {
              "error": "INTERNAL_ERROR",
              "details": { "error": "error message" }
            }
            (Logged to console for investigation)
```

---

## 10. Scaling Roadmap

```
PHASE 1: PROTOTYPE (Current)
  Database: D1 (SQLite)
  Scale: 100-1,000 responses
  Latency: <100ms
  Status: ✓ Ready

PHASE 2: GROWTH (3-6 months)
  Database: D1 (SQLite)
  Scale: 1,000-100,000 responses
  Latency: <200ms
  Status: Monitoring needed

PHASE 3: PRODUCTION (6-12 months)
  Database: Neon (PostgreSQL)
  Scale: 100,000-1,000,000 responses
  Latency: <300ms
  Status: Migrate code minimal changes

PHASE 4: ENTERPRISE (12+ months)
  Database: Data Warehouse (BigQuery, Snowflake)
  Scale: 1,000,000+ responses
  Latency: <5 seconds (async queries)
  Status: Analytics-focused, archive responses

MIGRATION EFFORT:
  D1 → Postgres: ~2 days (SQL syntax changes only)
  Postgres → DW: ~1 week (ETL pipeline)
  Code changes: ~5% of total code (database client only)
```

---

## Summary

This architecture provides:
- Multi-tenant isolation via company_id filtering
- Version-safe question management
- High-performance queries via strategic indexing
- Extensibility via JSONB columns
- Audit trail for compliance
- Webhook integration points
- Clear error handling
- Production-grade reliability

All achieved with simple, normalized schema and standard SQL patterns.
