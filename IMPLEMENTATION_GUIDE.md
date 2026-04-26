# Implementation Guide: Response Storage & Query Layer

**Date**: 2026-04-26  
**Status**: Ready for implementation  
**Owner**: Nihat (N)  
**Est. Implementation**: 2-3 weeks in phases

---

## Quick Start Checklist

- [ ] Review schema design (`assessment-response-layer.md`)
- [ ] Create D1 database in Cloudflare
- [ ] Apply schema migrations (`d1-schema.sql`)
- [ ] Integrate Worker code (`worker-implementation.ts`)
- [ ] Test endpoints with sample data
- [ ] Deploy to production

---

## Part 1: Database Setup (Day 1)

### Step 1: Create D1 Database

```bash
# Create the database
wrangler d1 create assessment_db

# You'll get a database_id like: 12345678-1234-1234-1234-123456789abc
# Save this for wrangler.toml
```

### Step 2: Update wrangler.toml

```toml
[env.production]
d1_databases = [
  { binding = "DB", database_name = "assessment_db", database_id = "YOUR_ID_HERE" }
]

[env.development]
d1_databases = [
  { binding = "DB", database_name = "assessment_db_dev", database_id = "YOUR_DEV_ID_HERE" }
]
```

### Step 3: Run Schema Migrations

```bash
# Apply the initial schema
wrangler d1 execute assessment_db --file=./d1-schema.sql

# Verify tables were created
wrangler d1 execute assessment_db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 4: Verify Sample Data

```bash
# Check test company was created
wrangler d1 execute assessment_db --command "SELECT * FROM companies;"

# Check questions were inserted
wrangler d1 execute assessment_db --command "SELECT * FROM questions;"
```

---

## Part 2: Worker Integration (Day 2-3)

### Step 1: Install Dependencies

```bash
npm install itty-router @cloudflare/workers-types
```

### Step 2: Add the Handler Code

Copy `worker-implementation.ts` into your `src/handlers/` directory:

```
src/
├── index.ts                    # Main worker entry point
├── handlers/
│   └── responses.ts            # Contains all endpoint handlers
└── middleware/
    └── auth.ts                 # Optional: API key validation
```

### Step 3: Update Main Worker File

```typescript
// src/index.ts
import { Router } from 'itty-router';
import { createRouter } from './handlers/responses';

interface Env {
  DB: D1Database;
}

const router = createRouter();

// Add 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Optional: Add CORS headers
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const response = await router.handle(request, env);

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');

    return response;
  }
};
```

### Step 4: Test Locally

```bash
# Start local development server
wrangler dev

# In another terminal, test the API
curl http://localhost:8787/api/companies/0123456789abcdef
```

---

## Part 3: Integration Testing (Day 4)

### Test 1: Create a Company

```bash
curl -X POST http://localhost:8787/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "acme-corp",
    "name": "ACME Corporation",
    "config": {
      "industry": "technology",
      "size": "500-1000"
    }
  }'

# Expected response:
# {
#   "id": "abc123def456",
#   "slug": "acme-corp",
#   "name": "ACME Corporation",
#   "created_at": "2026-04-26T10:00:00Z"
# }
```

### Test 2: Create a Question Set

```bash
curl -X POST http://localhost:8787/api/companies/abc123def456/question-sets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Maturity Assessment",
    "description": "Evaluate team AI competency",
    "questions": [
      {
        "id": "ai-tooling",
        "text": "How familiar are you with AI tools?",
        "type": "likert",
        "scale_min": 1,
        "scale_max": 5,
        "category": "ai-tools"
      },
      {
        "id": "prompt-engineering",
        "text": "How skilled are you in prompt engineering?",
        "type": "likert",
        "scale_min": 1,
        "scale_max": 5,
        "category": "skills"
      }
    ]
  }'
```

### Test 3: Submit a Response

```bash
curl -X POST http://localhost:8787/api/companies/abc123def456/responses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@acme.com",
    "department": "Engineering",
    "role": "Senior Engineer",
    "ai_maturity_score": 72,
    "maturity_level": "intermediate",
    "questions": [
      {
        "id": "ai-tooling",
        "score": 4
      },
      {
        "id": "prompt-engineering",
        "score": 3
      }
    ]
  }'

# Expected response:
# {
#   "id": "resp123456789",
#   "company_id": "abc123def456",
#   "created_at": "2026-04-26T10:05:00Z",
#   "average_score": 3.5,
#   "total_questions": 2,
#   "status": "submitted"
# }
```

### Test 4: Query Responses with Filters

```bash
# List all responses
curl http://localhost:8787/api/companies/abc123def456/responses

# Filter by date range
curl "http://localhost:8787/api/companies/abc123def456/responses?dateFrom=2026-01-01&dateTo=2026-12-31"

# Filter by score range
curl "http://localhost:8787/api/companies/abc123def456/responses?scoreMin=3&scoreMax=5"

# Filter by department
curl "http://localhost:8787/api/companies/abc123def456/responses?department=Engineering"

# Combine filters with pagination
curl "http://localhost:8787/api/companies/abc123def456/responses?scoreMin=3&limit=10&offset=0&sortBy=created_at&sortOrder=desc"
```

### Test 5: Get Analytics

```bash
curl "http://localhost:8787/api/companies/abc123def456/analytics?dateFrom=2026-01-01&dateTo=2026-12-31"

# Expected response:
# {
#   "summary": {
#     "total_responses": 42,
#     "mean_score": 3.7,
#     "min_score": 1.5,
#     "max_score": 4.8
#   },
#   "score_distribution": [...],
#   "by_maturity_level": [...],
#   "by_department": [...]
# }
```

---

## Part 4: Production Deployment

### Step 1: Database Migration Strategy

For production, use versioned migrations:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_webhooks.sql
├── 003_add_audit_log.sql
└── 004_add_custom_indexes.sql
```

Apply migrations in order:

```bash
# Create migration
wrangler d1 migrations create assessment_db add_webhooks

# Apply pending migrations
wrangler d1 migrations apply assessment_db --remote
```

### Step 2: Environment-Specific Configuration

```toml
[env.production]
name = "assessment-api-prod"
d1_databases = [
  { binding = "DB", database_name = "assessment_db", database_id = "..." }
]
vars = { ENVIRONMENT = "production" }

[env.staging]
name = "assessment-api-staging"
d1_databases = [
  { binding = "DB", database_name = "assessment_db_staging", database_id = "..." }
]
vars = { ENVIRONMENT = "staging" }
```

### Step 3: Deploy

```bash
# Deploy to staging
wrangler deploy --env staging

# Test in staging
curl https://assessment-api-staging.example.com/api/companies

# Deploy to production
wrangler deploy --env production

# Test in production
curl https://assessment-api.example.com/api/companies
```

### Step 4: Monitor

```bash
# View logs
wrangler tail assessment-api-prod

# Check database size
wrangler d1 info assessment_db

# Backup data
wrangler d1 backup create assessment_db
```

---

## Part 5: Extending the System

### Add Webhooks Integration

```typescript
// In a new handler: src/handlers/webhooks.ts

export async function createWebhook(request: IRequest, env: Env): Promise<Response> {
  const companyId = (request as any).params.companyId;
  const body = await request.json();

  const webhookId = generateId();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO webhooks (id, company_id, url, event_type, headers, active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `)
    .bind(
      webhookId,
      companyId,
      body.url,
      body.event_type,
      JSON.stringify(body.headers || {}),
      now
    )
    .run();

  return createSuccessResponse(
    { id: webhookId, company_id: companyId, created_at: now },
    201
  );
}
```

Then attach to router:

```typescript
router.post('/api/companies/:companyId/webhooks', createWebhook);
```

### Add Export to CSV

```typescript
export async function exportResponses(request: IRequest, env: Env): Promise<Response> {
  const companyId = (request as any).params.companyId;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'csv';

  const responses = await env.DB.prepare(`
    SELECT
      r.id, r.respondent_name, r.respondent_email, r.respondent_department,
      r.average_score, r.ai_maturity_score, r.maturity_level, r.created_at
    FROM responses r
    WHERE r.company_id = ?
    ORDER BY r.created_at DESC
  `)
    .bind(companyId)
    .all();

  if (format === 'csv') {
    const csv = convertToCSV(responses.results as any[]);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="responses-${companyId}.csv"`
      }
    });
  }

  return createErrorResponse({ format: 'Invalid format' }, 'INVALID_FORMAT', 400);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',')
    )
  ];

  return csv.join('\n');
}
```

---

## Common Issues & Troubleshooting

### Issue: "D1 database not found"

**Solution**: Check your wrangler.toml binding name matches in code.

```toml
# wrangler.toml
d1_databases = [{ binding = "DB", database_name = "assessment_db" }]

# TypeScript
interface Env {
  DB: D1Database;  // Must match binding name
}
```

### Issue: "UNIQUE constraint failed"

**Solution**: The email + company_id combination already exists. This is intentional (allows same person to respond twice). To update: use PUT endpoint or check for duplicates.

### Issue: "Foreign key constraint failed"

**Solution**: Usually means question_set_id or company_id doesn't exist. Verify:

```bash
# Check company exists
wrangler d1 execute assessment_db --command "SELECT id FROM companies WHERE id = 'xxx';"

# Check question set exists
wrangler d1 execute assessment_db --command "SELECT id FROM question_sets WHERE id = 'yyy';"
```

### Issue: Slow Queries on 10k+ Records

**Solution**: Queries use indexed columns. If slow, verify indexes:

```bash
wrangler d1 execute assessment_db --command "PRAGMA index_list(responses);"
```

Add composite indexes if needed:

```sql
CREATE INDEX idx_responses_company_date_score
  ON responses(company_id, created_at DESC, average_score DESC);
```

---

## Performance Benchmarks

### Current Schema Performance (Estimated on 10k+ records)

| Operation | Latency | Notes |
|-----------|---------|-------|
| POST /responses | 50-100ms | Insert + validation |
| GET /responses (no filters) | 30-50ms | Paginated, 50 records |
| GET /responses (with 3+ filters) | 50-100ms | Uses composite index |
| GET /analytics | 100-200ms | Aggregates all responses |
| GET /responses/:id | 20-30ms | Direct lookup |

### Scaling Notes

- **1,000 responses**: No issues
- **10,000 responses**: All queries sub-200ms with indexes
- **100,000 responses**: May need query optimization or sharding
- **1,000,000+ responses**: Consider archival strategy

---

## Data Lifecycle & Archival

### Keep Recent Data Hot

```sql
-- Archive old responses (> 2 years) to cold storage
CREATE TABLE responses_archived AS
SELECT * FROM responses
WHERE created_at < datetime('now', '-2 years');

DELETE FROM responses
WHERE created_at < datetime('now', '-2 years');
```

### Backup Strategy

```bash
# Weekly backup
wrangler d1 backup create assessment_db

# List backups
wrangler d1 backup list assessment_db

# Restore if needed
wrangler d1 backup restore assessment_db <backup_id>
```

---

## Security Checklist

- [ ] Validate all inputs (done in code)
- [ ] Use prepared statements (done in code)
- [ ] Add API key validation middleware
- [ ] Enable CORS only for known domains
- [ ] Rate limit by company_id
- [ ] Log all mutations to audit_log (done)
- [ ] Encrypt sensitive data in custom_fields
- [ ] Implement request signing for webhooks
- [ ] Regular security audits of audit_log

---

## Next Steps (Week-by-Week)

### Week 1: Foundation
- [x] Design schema & API
- [x] Write implementation code
- [ ] Set up D1 database
- [ ] Integrate Worker code
- [ ] Test locally

### Week 2: Testing & Polish
- [ ] Load testing (1000+ responses)
- [ ] Fix any issues
- [ ] Add error handling edge cases
- [ ] Write API documentation

### Week 3: Production Ready
- [ ] Deploy to staging
- [ ] Security audit
- [ ] Performance testing
- [ ] Deploy to production

### Week 4+: Monitoring & Extensions
- [ ] Monitor real production traffic
- [ ] Add webhooks integration
- [ ] Implement CSV export
- [ ] Build analytics dashboard

---

## Files Summary

| File | Purpose | Usage |
|------|---------|-------|
| `assessment-response-layer.md` | Schema design & architecture | Reference for understanding design decisions |
| `worker-implementation.ts` | Full Worker code | Copy to `src/handlers/responses.ts` |
| `d1-schema.sql` | Database schema | Run with `wrangler d1 execute` |
| `IMPLEMENTATION_GUIDE.md` | This file | Step-by-step setup instructions |

---

## Questions & Support

- **Schema questions**: See `assessment-response-layer.md` sections 1-5
- **Code questions**: Review `worker-implementation.ts` inline comments
- **Deployment questions**: See Part 4 of this guide
- **Performance issues**: Check troubleshooting section

For architecture reviews or design decisions, contact Nihat.
