# Deployment & Testing Guide

## Prerequisites

- Cloudflare account with Workers enabled
- `wrangler` CLI installed (`npm install -g wrangler`)
- Access to your project repository
- (Optional) GitHub token for archival workflow

---

## Step 1: Create D1 Database

```bash
cd workers/

# Create the database
wrangler d1 create ai-assessment-db

# Output will include:
# ✓ Successfully created DB 'ai-assessment-db' in region us-east-1
# [[d1_databases]]
# binding = "DB"
# database_name = "ai-assessment-db"
# database_id = "abc123def456..."

# Copy the database_id for later
```

---

## Step 2: Apply Schema

```bash
# Execute all table creation statements
wrangler d1 execute ai-assessment-db --file d1-schema.sql

# You should see:
# ✓ Executed d1-schema.sql
# Rows affected: 0 (DDL statements don't return row counts)
```

---

## Step 3: Configure wrangler.toml

Create or update `wrangler.toml` in your project root:

```toml
name = "ai-assessment-api"
type = "javascript"
account_id = "your-cloudflare-account-id"
workers_dev = true

# D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "ai-assessment-db"
database_id = "your-database-id-from-step-1"

# KV Namespace for Rate Limiting
[[kv_namespaces]]
binding = "FORM_SUBMISSIONS"
id = "your-kv-namespace-id"

# Environment Variables
[env.production]
name = "ai-assessment-api-prod"
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[env.staging]
name = "ai-assessment-api-staging"
```

### Get or Create KV Namespace

```bash
# List existing namespaces
wrangler kv:namespace list

# Or create a new one
wrangler kv:namespace create "FORM_SUBMISSIONS"
wrangler kv:namespace create "FORM_SUBMISSIONS" --preview

# Copy the namespace IDs to wrangler.toml
```

---

## Step 4: Add Secrets (If Using GitHub Archival)

```bash
# This prompts you to paste the token interactively
wrangler secret put GITHUB_TOKEN

# Verify (lists secret names only, not values)
wrangler secret list
```

---

## Step 5: Deploy Worker

```bash
# Deploy to production
wrangler deploy

# Or with environment:
wrangler deploy --env production

# Output will show:
# ✓ Uploaded ai-assessment-api (2.5 KB)
# ✓ Published ai-assessment-api
#   https://ai-assessment-api.your-subdomain.workers.dev

# Note the URL for testing
```

---

## Step 6: Local Testing (Optional)

```bash
# Start local dev server
wrangler dev

# The worker will run at:
# http://localhost:8787

# Keep this terminal open while testing
```

---

## Step 7: Test Endpoints

### Test 1: Submit a Response (POST /responses)

```bash
# Create a test payload file: test-payload.json
cat > test-payload.json << 'EOF'
{
  "company": "test-company",
  "name": "Test User",
  "email": "test@example.com",
  "department": "Engineering",
  "role": "Engineer",
  "questions": [
    { "id": "q1", "score": 3.5, "label": "Using AI in product?" },
    { "id": "q2", "score": 4.0, "label": "Organization AI adoption?" },
    { "id": "q3", "score": 2.5, "label": "AI governance in place?" }
  ],
  "aiMaturityScore": 3.33,
  "maturityLevel": "Developing"
}
EOF

# Submit (using live worker URL)
curl -X POST https://ai-assessment-api.your-subdomain.workers.dev/responses \
  -H "Content-Type: application/json" \
  -H "Origin: https://ai-next-agency.github.io" \
  -d @test-payload.json

# Expected response:
# {
#   "success": true,
#   "message": "Assessment submitted successfully",
#   "responseId": "a1b2c3d4-e5f6-...",
#   "submittedAt": "2026-04-26T22:30:00Z",
#   "dashboardPreview": { ... }
# }
```

### Test 2: Fetch Dashboard (GET /analytics/dashboard/:company)

```bash
# After submitting a response, fetch the dashboard
curl https://ai-assessment-api.your-subdomain.workers.dev/analytics/dashboard/test-company \
  -H "Origin: https://ai-next-agency.github.io"

# Expected response: Large JSON with summary, maturityDistribution, scoreDistribution, etc.
# Should contain your test submission data
```

### Test 3: Fetch Details (GET /analytics/details/:company)

```bash
curl https://ai-assessment-api.your-subdomain.workers.dev/analytics/details/test-company?breakdown=questions \
  -H "Origin: https://ai-next-agency.github.io"

# Expected: Question-by-question breakdown with averages and distributions
```

### Test 4: Fetch Single Response (GET /responses/:responseId)

```bash
# Use the responseId from the submit response
curl https://ai-assessment-api.your-subdomain.workers.dev/responses/a1b2c3d4-e5f6-... \
  -H "Origin: https://ai-next-agency.github.io"

# Expected: Full response data (name, email, questions, scores, etc.)
```

---

## Step 8: Verify Data in D1

```bash
# Query the responses table
wrangler d1 execute ai-assessment-db --command "SELECT * FROM responses LIMIT 1;"

# Query aggregated metrics
wrangler d1 execute ai-assessment-db --command "SELECT * FROM company_daily_metrics WHERE company = 'test-company';"

# Check maturity distribution
wrangler d1 execute ai-assessment-db --command "SELECT * FROM company_maturity_distribution WHERE company = 'test-company';"
```

---

## Step 9: Load Testing (Optional)

Create a load test script to verify performance under realistic volume:

```javascript
// load-test.js (Node.js)
import fetch from 'node-fetch';

const WORKER_URL = 'https://ai-assessment-api.your-subdomain.workers.dev';
const COMPANY = 'load-test-company';
const NUM_REQUESTS = 100;

async function loadTest() {
  console.log(`Running load test: ${NUM_REQUESTS} submissions...`);

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < NUM_REQUESTS; i++) {
    const payload = {
      company: COMPANY,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      department: 'Test',
      role: 'Tester',
      questions: [
        { id: 'q1', score: Math.random() * 4 + 1 },
        { id: 'q2', score: Math.random() * 4 + 1 }
      ],
      aiMaturityScore: Math.random() * 4 + 1,
      maturityLevel: ['Initial', 'Beginner', 'Developing', 'Advanced', 'Optimized'][
        Math.floor(Math.random() * 5)
      ]
    };

    const t0 = Date.now();
    try {
      const res = await fetch(`${WORKER_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://ai-next-agency.github.io'
        },
        body: JSON.stringify(payload)
      });

      const t1 = Date.now();
      const duration = t1 - t0;
      results.push({ status: res.status, duration });

      if (!res.ok) {
        console.error(`Request ${i} failed: ${res.status}`);
      }
    } catch (error) {
      console.error(`Request ${i} error:`, error.message);
      results.push({ status: 'error', duration: 0 });
    }
  }

  const totalTime = Date.now() - startTime;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));

  console.log(`\nLoad Test Results:`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Avg duration per request: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration}ms, Max: ${maxDuration}ms`);
  console.log(`  Requests/sec: ${(NUM_REQUESTS / (totalTime / 1000)).toFixed(1)}`);

  // Fetch dashboard to verify aggregation
  console.log(`\nFetching dashboard...`);
  const t0 = Date.now();
  const dashboardRes = await fetch(`${WORKER_URL}/analytics/dashboard/${COMPANY}`, {
    headers: { 'Origin': 'https://ai-next-agency.github.io' }
  });
  const t1 = Date.now();

  const dashboard = await dashboardRes.json();
  console.log(`  Dashboard fetch: ${t1 - t0}ms`);
  console.log(`  Total responses in dashboard: ${dashboard.summary.total_responses}`);
  console.log(`  Avg maturity score: ${dashboard.summary.avg_maturity_score.toFixed(2)}`);
}

loadTest();
```

Run it:

```bash
node load-test.js
```

Expected output:

```
Running load test: 100 submissions...

Load Test Results:
  Total time: 28500ms
  Avg duration per request: 285ms
  Min: 250ms, Max: 320ms
  Requests/sec: 3.5

Fetching dashboard...
  Dashboard fetch: 45ms
  Total responses in dashboard: 100
  Avg maturity score: 3.15
```

---

## Step 10: Monitor in Production

### Check Worker Logs

```bash
# View live logs
wrangler tail

# Filter by status
wrangler tail --format pretty --status ok
```

### Check D1 Metrics

In the Cloudflare Dashboard:
1. Workers → Your Worker Name
2. Analytics Tab
3. See requests, errors, latencies

### Query Execution Logs

```bash
wrangler d1 execute ai-assessment-db --command \
  "SELECT * FROM aggregate_execution_log ORDER BY completed_at DESC LIMIT 10;"
```

---

## Troubleshooting

### Issue: "D1 binding not found" or Worker errors

**Solution**: Ensure `wrangler.toml` has correct `database_id`:

```bash
# List all databases
wrangler d1 list

# Copy the ID to wrangler.toml
```

### Issue: Rate Limit Errors ("Too many submissions")

**Solution**: This is by design (5 submissions per IP per 5 minutes). For testing:

1. Use different IPs (VPN, different networks)
2. Or wait 5 minutes between tests
3. Or modify the rate limit in `response-handler.js` for testing

### Issue: CORS Errors from Frontend

**Solution**: Ensure the frontend origin is in the allowed list in `response-handler.js`:

```javascript
const allowedOrigins = [
  'https://ai-next-agency.github.io',
  'https://inflownetwork.com',
  'http://localhost:3000' // Add for local dev
];
```

Redeploy after changes:

```bash
wrangler deploy
```

### Issue: Dashboard Returns Empty Data

**Solution**: Ensure at least one response was submitted successfully. Check:

```bash
# Query responses table
wrangler d1 execute ai-assessment-db --command \
  "SELECT COUNT(*) FROM responses WHERE company = 'your-company';"

# Should return count > 0
```

---

## E2E Testing Checklist

Run these in order to verify everything works:

- [ ] D1 database created and schema applied
- [ ] wrangler.toml configured with database_id and KV namespace
- [ ] Worker deployed to Cloudflare
- [ ] Secrets set (if using GitHub archival)
- [ ] Test POST /responses with valid payload
- [ ] Verify response ID returned
- [ ] Query GET /analytics/dashboard/:company
- [ ] Verify dashboard contains aggregated data
- [ ] Query GET /analytics/details/:company?breakdown=questions
- [ ] Query GET /responses/:responseId (from POST response)
- [ ] Load test: 100 submissions in <30 seconds
- [ ] Dashboard fetch still <50ms during load
- [ ] Check D1 execution logs for any errors
- [ ] Frontend forms successfully submit to worker
- [ ] Frontend dashboard renders charts from API responses

---

## Next Steps

1. **Move to Production**: Update `wrangler.toml` with production domain and deploy to production environment
2. **Share with Teams**: Distribute worker URL to teams deploying forms
3. **Monitor**: Set up alerts in Cloudflare for error rates
4. **Archive Parallel**: If using GitHub Actions, verify workflow still runs
5. **Dashboard Frontend**: Build React/Vue dashboard consuming `/analytics/dashboard` endpoint

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous worker version
wrangler rollback

# Or delete this deployment and redeploy
wrangler delete
wrangler deploy
```

D1 data is safe (we only insert, never delete in worker code).

---

## Cost Estimate (April 2026)

| Component | Cost | Notes |
|-----------|------|-------|
| Cloudflare Workers | Free tier | 100k requests/day free |
| D1 (SQLite) | Free tier | 1GB storage free, $0.75/GB overage |
| KV (Rate Limit) | Free tier | 10GB free, overage $0.50/GB |
| **Total** | **Free** | (For typical assessment system) |

---

## Success Metrics

After deployment, track:

- **Submit latency**: Measure P50, P95, P99 (target: <300ms)
- **Dashboard latency**: Measure cold/warm (target: <50ms cold, <5ms warm)
- **Error rate**: % of submissions that fail (target: <0.1%)
- **Cache hit rate**: % of dashboard requests from cache (target: >90%)
- **Aggregation accuracy**: Compare dashboard totals with manual count (target: 100% match)

Use Cloudflare Analytics and worker logs to track these metrics.
