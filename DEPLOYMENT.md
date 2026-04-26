# Deployment & Operations Guide

## Quick Start

### 1. Setup Cloudflare D1 Database

```bash
# Create a new D1 database
wrangler d1 create assessment-responses

# This returns DATABASE_ID and PREVIEW_DATABASE_ID
# Add them to wrangler.toml
```

### 2. Apply Schema

```bash
# Development
wrangler d1 execute assessment-responses-dev --file migrations/001_init_schema.sql

# Production
wrangler d1 execute assessment-responses --file migrations/001_init_schema.sql
```

### 3. Seed Companies & Questions (Optional)

```bash
# Use the Supabase UI to insert companies and questions, or:
wrangler d1 execute assessment-responses --command \
  "INSERT INTO companies (company_id, name, slug, question_count) VALUES ('your-company', 'Your Company', 'your-company', 10)"
```

### 4. Deploy Worker

```bash
# Development
npm run deploy:dev

# Production (requires setting API_SECRET)
wrangler secret put API_SECRET --env production
npm run deploy:prod
```

### 5. Test the API

```bash
# Health check (no auth)
curl https://api.example.com/api/health

# Submit a response (no auth required)
curl -X POST https://api.example.com/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "company": "acme-corp",
    "name": "Alice Smith",
    "email": "alice@acme.com",
    "department": "Engineering",
    "role": "Senior Engineer",
    "aiMaturityScore": 3.5,
    "maturityLevel": "scaling",
    "questions": [
      {"id": "q1", "score": 4},
      {"id": "q2", "score": 3},
      {"id": "q3", "score": 5}
    ]
  }'

# List responses (requires auth)
curl https://api.example.com/api/responses?company=acme-corp \
  -H "Authorization: Bearer YOUR_API_SECRET"

# Get single response (requires auth)
curl https://api.example.com/api/responses/resp_abc123xyz?company=acme-corp \
  -H "Authorization: Bearer YOUR_API_SECRET"

# Get stats (requires auth)
curl https://api.example.com/api/responses/stats/acme-corp \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

---

## Environment Variables & Secrets

### Development
```toml
# wrangler.toml [env.development]
vars = { ENVIRONMENT = "development" }

# Optional: set a dev API secret for testing auth
wrangler secret put API_SECRET --env development
```

### Production
```bash
# Must set before deploying
wrangler secret put API_SECRET --env production

# Verify it's set (returns masked value)
wrangler secret list --env production
```

**API_SECRET purpose:**
- Protects dashboard query endpoints (`GET /api/responses`, etc.)
- `POST /api/responses` (form submission) does NOT require auth
- This allows public form submissions but private query access

---

## Adding a New Client

### 1. Create company record
```bash
wrangler d1 execute assessment-responses --command \
  "INSERT INTO companies (company_id, name, slug, question_count)
   VALUES ('new-client', 'New Client Inc', 'new-client', 12)"
```

### 2. Insert their questions
```bash
wrangler d1 execute assessment-responses --file - <<EOF
INSERT INTO questions (company_id, question_id, title, description, order_index)
VALUES
  ('new-client', 'q1', 'Question 1 Title', 'Description', 1),
  ('new-client', 'q2', 'Question 2 Title', 'Description', 2),
  ...
  ('new-client', 'q12', 'Question 12 Title', 'Description', 12);
EOF
```

### 3. Verify setup
```bash
# Check company
wrangler d1 execute assessment-responses --command \
  "SELECT * FROM companies WHERE company_id = 'new-client'"

# Check questions
wrangler d1 execute assessment-responses --command \
  "SELECT * FROM questions WHERE company_id = 'new-client'"
```

### 4. Generate form submission URL
Share this with the client:
```
https://api.example.com/api/responses
POST with JSON:
{
  "company": "new-client",
  "name": "...",
  "email": "...",
  "department": "...",
  "role": "...",
  "aiMaturityScore": 0-5,
  "maturityLevel": "foundation|emerging|scaling|leading",
  "questions": [
    {"id": "q1", "score": 1-5},
    ...
  ]
}
```

---

## Monitoring & Debugging

### View Worker Logs
```bash
# Stream logs in real-time
wrangler tail --env production

# Or view logs via Cloudflare Dashboard:
# Dashboard → Workers & Pages → assessment-responses-api → Logs
```

### Check Database Size
```bash
# D1 analytics via CLI
wrangler d1 info assessment-responses

# Or via Dashboard: https://dash.cloudflare.com → Workers → D1 databases
```

### Query Database Directly
```bash
# Interactive shell
wrangler d1 execute assessment-responses --interactive

# Single query
wrangler d1 execute assessment-responses --command \
  "SELECT COUNT(*) as total FROM responses WHERE company_id = 'acme-corp'"
```

### Common Issues

**"company_not_found"**
- Verify company_id exists in `companies` table
- Check spelling (case-sensitive)

**"invalid_question_count"**
- Verify question count matches company's `question_count` field
- Check that all questions have valid IDs matching `questions` table

**"duplicate_submission"**
- Email was submitted in the last 24 hours
- Normal behavior—prevents accidental re-submissions
- Change the check in `worker-responses-api.ts` if needed

**API_SECRET not working**
- Verify secret is set: `wrangler secret list --env production`
- Bearer token must match exactly

---

## Backup & Export

### Export all responses (CSV)
```bash
# Query to CSV
wrangler d1 execute assessment-responses --command \
  "SELECT response_id, name, email, ai_maturity_score, maturity_level, created_at FROM responses WHERE company_id = 'acme-corp'" \
  > responses.csv
```

### Backup entire database
```bash
# D1 databases are automatically backed up by Cloudflare
# For manual backup, export schema + data:

wrangler d1 execute assessment-responses --command ".dump" > backup.sql
```

### Restore from backup
```bash
wrangler d1 execute assessment-responses --file backup.sql
```

---

## Scaling Considerations

### Current Limits
- **D1 (SQLite on Cloudflare)**: Up to 10 GB database size
- **Queries**: Optimized for < 100k responses per company
- **Write throughput**: Serialized (SQLite limitation)

### When to optimize

**At 100k responses/company:**
- Index on `(company_id, created_at)` is sufficient for list queries
- Consider caching stats endpoint (compute nightly)

**At 1M+ responses:**
- Archive old responses to cold storage
- Create separate `response_summaries` table (daily aggregates)
- Implement pagination to stats endpoint

### Archive Old Responses (Optional)
```sql
-- Example: Move responses > 12 months old to archive
-- (Requires separate archive table)

INSERT INTO responses_archive
SELECT * FROM responses
WHERE created_at < datetime('now', '-1 year');

DELETE FROM responses
WHERE created_at < datetime('now', '-1 year');
```

---

## Cost Estimates (Cloudflare)

| Component | Free Tier | Pro | Note |
|-----------|-----------|-----|------|
| Workers | 100k req/day | Unlimited | $0.50 per 1M requests |
| D1 | Included | Included | Charged by compute time |
| Requests to D1 | Included | Included | Very low cost |

**Typical costs (production):**
- 10k form submissions/month: ~$0 (free tier)
- 100k form submissions/month: ~$2–5 (D1 compute)
- 1M form submissions/month: ~$20–50 (D1 compute + worker requests)

---

## Compliance & Security

### Data Retention
- By default, responses are kept indefinitely
- Add a `deleted_at` field if you need soft deletes
- Add a scheduled task (cron) to hard-delete old responses if needed

### Email Privacy
- Emails are stored in plaintext (searchable, indexable)
- If GDPR applies, implement data deletion endpoint
- Consider hashing emails in metadata instead of storing plaintext

### Authentication
- `API_SECRET` is a simple Bearer token
- For production: upgrade to JWT or OAuth if needed
- Example upgrade: check JWT signature in middleware

### IP Logging
- `metadata_json` captures `cf-connecting-ip` (Cloudflare header)
- Useful for fraud detection, optional to disable

---

## Development Workflow

### Local Testing
```bash
# Start local development server
npm run dev

# This starts:
# - Worker on http://localhost:8787
# - D1 preview database (in-memory)

# Test form submission
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### TypeScript Type Checking
```bash
npm run type-check
```

### Building for Production
```bash
npm run build  # Bundles and minifies into dist/index.js
npm run deploy:prod  # Deploys built code
```

---

## Runbook: Emergency Response

### Database is down
1. Check Cloudflare status: https://www.cloudflarestatus.com
2. Worker will return 500 on POST/GET
3. Cloudflare typically has SLA of 99.99%

### High error rate on submissions
```bash
# Check logs
wrangler tail --env production --format pretty

# Common causes:
# - Invalid company_id
# - Question count mismatch
# - Email validation failure
# - API_SECRET misconfiguration (if auth enabled)
```

### Accidental data deletion
1. Stop ingesting (no write protection in current schema)
2. Restore from backup: `wrangler d1 execute ... --file backup.sql`
3. Verify restore integrity before resuming

### API_SECRET exposure
```bash
# Rotate immediately
wrangler secret put API_SECRET --env production

# Redeploy (no code change needed, secrets are separate)
npm run deploy:prod
```

---

## Useful Commands Reference

```bash
# Deployment
npm run deploy:dev
npm run deploy:prod

# Database management
wrangler d1 list
wrangler d1 info assessment-responses
wrangler d1 execute assessment-responses --command "SELECT COUNT(*) FROM responses"
wrangler d1 execute assessment-responses --file migrations/001_init_schema.sql

# Secrets
wrangler secret put API_SECRET --env production
wrangler secret list --env production

# Monitoring
wrangler tail --env production
wrangler logs --env production

# Local testing
npm run dev
npm run type-check
```

---

## Support & Debugging

### Common endpoints for testing
```bash
# Health check
GET /api/health

# Submit response
POST /api/responses
Authorization: (none required)

# List responses
GET /api/responses?company=acme-corp
Authorization: Bearer ${API_SECRET}

# Get single response
GET /api/responses/resp_abc123?company=acme-corp
Authorization: Bearer ${API_SECRET}

# Get stats
GET /api/responses/stats/acme-corp
Authorization: Bearer ${API_SECRET}
```

### Debug checklist
- [ ] Company exists in `companies` table
- [ ] Question count matches company config
- [ ] All question IDs exist in `questions` table
- [ ] API_SECRET is set (for protected endpoints)
- [ ] Headers include `Content-Type: application/json`
- [ ] Email is unique (or 24-hour window allows duplicate)
- [ ] All required fields present in submission
