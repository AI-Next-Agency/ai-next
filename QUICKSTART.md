# Quick Start: Assessment Response System

## 5-Minute Setup

### 1. Create D1 Database
```bash
cd /path/to/ai-next

# Create the database
wrangler d1 create assessment-responses

# Copy the DATABASE_ID and PREVIEW_DATABASE_ID to wrangler.toml
```

### 2. Update wrangler.toml
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "assessment-responses"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. Apply Schema
```bash
wrangler d1 execute assessment-responses --file migrations/001_init_schema.sql
```

### 4. Set API Secret
```bash
wrangler secret put API_SECRET --env production
# Enter a secure random string (32+ chars recommended)
```

### 5. Deploy Worker
```bash
npm install
npm run deploy:prod
```

### 6. Test
```bash
# Health check
curl https://api.example.com/api/health

# Submit a response
curl -X POST https://api.example.com/api/responses \
  -H "Content-Type: application/json" \
  -d '{
    "company": "acme-corp",
    "name": "John Doe",
    "email": "john@acme.com",
    "department": "Engineering",
    "role": "Engineer",
    "aiMaturityScore": 3.5,
    "maturityLevel": "scaling",
    "questions": [
      {"id": "q1", "score": 4},
      {"id": "q2", "score": 3},
      {"id": "q3", "score": 5}
    ]
  }'
```

---

## System Overview

### 3 Tables
| Table | Purpose | Rows |
|-------|---------|------|
| `companies` | Client metadata | 1 per company |
| `questions` | Assessment questions | ~10 per company |
| `responses` | Form submissions | 1 per submission |

### 3 Endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/responses` | No | Submit form |
| `GET /api/responses` | Yes | List responses |
| `GET /api/responses/:id` | Yes | Get detail |

---

## Adding Your First Company

```bash
# Insert company
wrangler d1 execute assessment-responses --command \
  "INSERT INTO companies (company_id, name, slug, question_count)
   VALUES ('acme-corp', 'ACME Corporation', 'acme-corp', 3)"

# Insert questions
wrangler d1 execute assessment-responses --command \
  "INSERT INTO questions (company_id, question_id, title, order_index)
   VALUES
     ('acme-corp', 'q1', 'Does your org have an AI strategy?', 1),
     ('acme-corp', 'q2', 'Do you measure AI ROI?', 2),
     ('acme-corp', 'q3', 'Does leadership have AI literacy?', 3)"

# Verify
wrangler d1 execute assessment-responses --command \
  "SELECT COUNT(*) as count FROM questions WHERE company_id = 'acme-corp'"
```

---

## Local Development

```bash
# Start local worker + D1
npm run dev

# Worker is now at http://localhost:8787
# Test submission:
curl -X POST http://localhost:8787/api/responses \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

---

## Common Tasks

### View all responses for a company
```bash
curl https://api.example.com/api/responses?company=acme-corp \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

### Get stats for a company
```bash
curl https://api.example.com/api/responses/stats/acme-corp \
  -H "Authorization: Bearer YOUR_API_SECRET"
```

### Export responses to CSV
```bash
wrangler d1 execute assessment-responses --command \
  "SELECT response_id, name, email, ai_maturity_score FROM responses WHERE company_id = 'acme-corp'" \
  > responses.csv
```

### View worker logs
```bash
wrangler tail --env production
```

---

## Next Steps

1. **Read** `assessment-system-design.md` for full architecture
2. **Review** `worker-responses-api.ts` for implementation details
3. **Check** `DEPLOYMENT.md` for operations runbook
4. **Import** `client-example.ts` patterns into your dashboard
5. **Monitor** with `wrangler tail` during rollout

---

## File Structure

```
ai-next/
├── assessment-system-design.md    ← Architecture & design decisions
├── worker-responses-api.ts        ← Main worker code
├── client-example.ts              ← Dashboard integration examples
├── migrations/
│   └── 001_init_schema.sql        ← Database schema
├── wrangler.toml                  ← Worker configuration
├── package.json                   ← Dependencies
├── DEPLOYMENT.md                  ← Operations runbook
└── QUICKSTART.md                  ← This file
```
