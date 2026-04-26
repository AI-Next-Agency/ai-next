# API Reference & Examples

Complete reference for all endpoints, request/response schemas, and example payloads.

---

## Base URL

```
https://your-assessment-api.workers.dev
```

Or with custom domain:

```
https://api.yourdomain.com
```

---

## Authentication & CORS

### CORS Headers
All endpoints require an `Origin` header from an allowed domain:

```javascript
const allowedOrigins = [
  'https://ai-next-agency.github.io',
  'https://inflownetwork.com',
  'http://localhost:3000'  // dev
];
```

If your origin is not listed, requests will be rejected with 403.

### Rate Limiting
- **Endpoint**: POST /responses
- **Limit**: 5 submissions per IP per 5 minutes
- **Storage**: Cloudflare KV (key: `form_submission:{ip}`)
- **Response Code**: 429 if exceeded

---

## POST /responses

**Submit a form response and immediately aggregate metrics.**

### Request

```http
POST /responses HTTP/1.1
Host: your-assessment-api.workers.dev
Content-Type: application/json
Origin: https://inflownetwork.com

{
  "company": "inflow-network",
  "name": "Alice Johnson",
  "email": "alice@inflownetwork.com",
  "department": "Product",
  "role": "Product Manager",
  "questions": [
    {
      "id": "q1",
      "score": 4.0,
      "label": "Are you using AI in product decisions?"
    },
    {
      "id": "q2",
      "score": 3.5,
      "label": "What is your organization's AI maturity level?"
    },
    {
      "id": "q3",
      "score": 2.5,
      "label": "Do you have AI governance policies in place?"
    }
  ],
  "aiMaturityScore": 3.33,
  "maturityLevel": "Developing"
}
```

### Request Schema

```typescript
interface SubmitResponseRequest {
  // Required
  company: string;                // 1-50 chars, lowercase letters/numbers/hyphens
  name: string;                   // Max 100 chars
  email: string;                  // Valid email format
  department: string;             // Max 100 chars
  role: string;                   // Max 100 chars
  
  questions: Array<{
    id: string;                   // Question identifier (e.g., 'q1', 'adoption_level')
    score: number;                // 1.0–5.0 (can be decimal: 3.5, 2.25, etc.)
    label?: string;               // Optional: human-readable question text
  }>;
  
  aiMaturityScore: number;        // 1.0–5.0, typically average or weighted score
  maturityLevel: string;          // 'Initial' | 'Beginner' | 'Developing' | 'Advanced' | 'Optimized'
}
```

### Response (Success)

```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: https://inflownetwork.com
Cache-Control: no-cache

{
  "success": true,
  "message": "Assessment submitted successfully",
  "responseId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "submittedAt": "2026-04-26T22:30:15.123Z",
  "dashboardPreview": {
    "company": "inflow-network",
    "timestamp": "2026-04-26T22:30:15.123Z",
    "summary": {
      "total_responses": 61,
      "avg_maturity_score": 3.24,
      "max_maturity_score": 4.8,
      "min_maturity_score": 1.0,
      "last_response_at": "2026-04-26T22:30:15.123Z"
    }
  }
}
```

### Response Schema

```typescript
interface SubmitResponseSuccess {
  success: true;
  message: string;
  responseId: string;                    // UUID, use for detail lookup
  submittedAt: string;                   // ISO 8601 timestamp
  dashboardPreview: {
    company: string;
    timestamp: string;
    summary: {
      total_responses: number;
      avg_maturity_score: number;        // May be null if no responses yet
      max_maturity_score: number | null;
      min_maturity_score: number | null;
      last_response_at: string | null;
    };
  };
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Missing required field: email"
}
```

Common validation errors:
- `Missing required field: {field}` — one of the required fields is missing
- `Invalid company slug` — company doesn't match `^[a-z0-9-]{1,50}$`
- `Invalid email format` — email doesn't match basic email regex
- `AI maturity score must be between 1 and 5` — score out of range
- `Questions must be an array` — questions field is not an array

#### 429 Too Many Requests

```json
{
  "error": "Too many submissions. Please wait before submitting again."
}
```

Wait 5 minutes before retrying from this IP.

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to submit assessment. Please try again later."
}
```

Contact support with the timestamp for debugging.

### Performance

- **Latency**: 150–300ms (p50, p95)
- **Includes**: Validation, D1 insert, 6 aggregation table updates
- **Async**: GitHub workflow trigger (if enabled)
- **Side Effects**: Cache invalidation on `/analytics/dashboard`

### Example (cURL)

```bash
curl -X POST https://your-api.workers.dev/responses \
  -H "Content-Type: application/json" \
  -H "Origin: https://inflownetwork.com" \
  -d '{
    "company": "inflow-network",
    "name": "Alice Johnson",
    "email": "alice@inflownetwork.com",
    "department": "Product",
    "role": "Product Manager",
    "questions": [
      {"id": "q1", "score": 4.0, "label": "Using AI?"},
      {"id": "q2", "score": 3.5, "label": "Maturity?"},
      {"id": "q3", "score": 2.5, "label": "Governance?"}
    ],
    "aiMaturityScore": 3.33,
    "maturityLevel": "Developing"
  }'
```

### Example (JavaScript/Fetch)

```javascript
async function submitAssessment(data) {
  const response = await fetch('https://your-api.workers.dev/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.error);
    throw new Error(error.error);
  }

  const result = await response.json();
  console.log('Response ID:', result.responseId);
  console.log('Dashboard preview:', result.dashboardPreview);
  return result;
}
```

---

## GET /analytics/dashboard/:company

**Fetch pre-aggregated dashboard metrics (cached 5 minutes).**

### Request

```http
GET /analytics/dashboard/inflow-network HTTP/1.1
Host: your-assessment-api.workers.dev
Origin: https://inflownetwork.com
Accept: application/json
```

### Response

```json
{
  "company": "inflow-network",
  "timestamp": "2026-04-26T22:35:00.000Z",

  "summary": {
    "total_responses": 61,
    "avg_maturity_score": 3.24,
    "max_maturity_score": 4.8,
    "min_maturity_score": 1.0,
    "last_response_at": "2026-04-26T22:30:15.123Z"
  },

  "maturityDistribution": [
    {
      "level": "Initial",
      "count": 5,
      "percentage": "8.2"
    },
    {
      "level": "Beginner",
      "count": 12,
      "percentage": "19.7"
    },
    {
      "level": "Developing",
      "count": 23,
      "percentage": "37.7"
    },
    {
      "level": "Advanced",
      "count": 18,
      "percentage": "29.5"
    },
    {
      "level": "Optimized",
      "count": 3,
      "percentage": "4.9"
    }
  ],

  "scoreDistribution": [
    {
      "bucket": "1.0–1.5",
      "count": 2,
      "percentage": "3.3"
    },
    {
      "bucket": "1.5–2.0",
      "count": 3,
      "percentage": "4.9"
    },
    {
      "bucket": "2.0–2.5",
      "count": 5,
      "percentage": "8.2"
    },
    {
      "bucket": "2.5–3.0",
      "count": 10,
      "percentage": "16.4"
    },
    {
      "bucket": "3.0–3.5",
      "count": 15,
      "percentage": "24.6"
    },
    {
      "bucket": "3.5–4.0",
      "count": 18,
      "percentage": "29.5"
    },
    {
      "bucket": "4.0–4.5",
      "count": 6,
      "percentage": "9.8"
    },
    {
      "bucket": "4.5–5.0",
      "count": 2,
      "percentage": "3.3"
    }
  ],

  "recentDailyMetrics": [
    {
      "date": "2026-04-26",
      "submissions": 3,
      "avgScore": 3.1
    },
    {
      "date": "2026-04-25",
      "submissions": 2,
      "avgScore": 3.4
    },
    {
      "date": "2026-04-24",
      "submissions": 4,
      "avgScore": 2.9
    },
    {
      "date": "2026-04-23",
      "submissions": 2,
      "avgScore": 3.5
    },
    {
      "date": "2026-04-22",
      "submissions": 4,
      "avgScore": 3.1
    },
    {
      "date": "2026-04-21",
      "submissions": 3,
      "avgScore": 3.2
    },
    {
      "date": "2026-04-20",
      "submissions": 5,
      "avgScore": 3.0
    }
  ],

  "submissionTimeline": [
    {
      "date": "2026-04-20",
      "submissions": 5,
      "avgScore": 3.0
    },
    {
      "date": "2026-04-21",
      "submissions": 3,
      "avgScore": 3.2
    },
    {
      "date": "2026-04-22",
      "submissions": 4,
      "avgScore": 3.1
    },
    {
      "date": "2026-04-23",
      "submissions": 2,
      "avgScore": 3.5
    },
    {
      "date": "2026-04-24",
      "submissions": 4,
      "avgScore": 2.9
    },
    {
      "date": "2026-04-25",
      "submissions": 2,
      "avgScore": 3.4
    },
    {
      "date": "2026-04-26",
      "submissions": 3,
      "avgScore": 3.1
    }
  ]
}
```

### Response Schema

```typescript
interface DashboardResponse {
  company: string;
  timestamp: string;                                    // When snapshot was taken

  summary: {
    total_responses: number;
    avg_maturity_score: number | null;
    max_maturity_score: number | null;
    min_maturity_score: number | null;
    last_response_at: string | null;
  };

  maturityDistribution: Array<{
    level: 'Initial' | 'Beginner' | 'Developing' | 'Advanced' | 'Optimized';
    count: number;
    percentage: string;                                 // "8.2" (as string for precision)
  }>;

  scoreDistribution: Array<{
    bucket: string;                                     // "1.0–1.5", "1.5–2.0", etc.
    count: number;
    percentage: string;
  }>;

  recentDailyMetrics: Array<{
    date: string;                                       // "2026-04-26"
    submissions: number;
    avgScore: number;
  }>;

  submissionTimeline: Array<{
    date: string;
    submissions: number;
    avgScore: number;
  }>;
}
```

### Headers

```
Cache-Control: public, max-age=300
X-From-Cache: true (if served from cache)
```

### Performance

- **Cold (first request)**: ~50ms
- **Warm (cached)**: <5ms
- **Cache TTL**: 5 minutes

### Example (Fetch + Cache Check)

```javascript
async function fetchDashboard(company) {
  const response = await fetch(
    `https://your-api.workers.dev/analytics/dashboard/${company}`,
    { headers: { 'Origin': 'https://inflownetwork.com' } }
  );

  const data = await response.json();
  const fromCache = response.headers.get('X-From-Cache') === 'true';

  console.log(`Fetched in ${fromCache ? '<5ms (cached)' : '~50ms (fresh)'}`);
  console.log(`Total responses: ${data.summary.total_responses}`);
  console.log(`Avg score: ${data.summary.avg_maturity_score}`);

  return data;
}
```

---

## GET /analytics/details/:company

**Fetch detailed breakdowns (not cached; for deeper analysis).**

### Request

```http
GET /analytics/details/inflow-network?breakdown=questions HTTP/1.1
Host: your-assessment-api.workers.dev
Origin: https://inflownetwork.com
Accept: application/json
```

### Query Parameters

| Param | Values | Default | Description |
|-------|--------|---------|-------------|
| `breakdown` | `all`, `maturity`, `questions`, `timeline` | `all` | Which breakdowns to include |

### Response (breakdown=questions)

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
        "distribution": {
          "1": 2,
          "2": 3,
          "3": 12,
          "4": 28,
          "5": 16
        }
      },
      {
        "id": "q2",
        "label": "What is your organization's AI maturity level?",
        "avgScore": 3.2,
        "responses": 61,
        "distribution": {
          "1": 5,
          "2": 8,
          "3": 20,
          "4": 18,
          "5": 10
        }
      }
    ]
  }
}
```

### Response Schema (breakdown=questions)

```typescript
interface DetailsResponse {
  company: string;
  details: {
    questionBreakdown: Array<{
      id: string;
      label: string;
      avgScore: number;
      responses: number;
      distribution: {
        [score: string]: number;  // "1": 2, "2": 3, etc.
      };
    }>;
  };
}
```

### Performance

- **Latency**: ~30ms (pre-aggregated question metrics)
- **Not cached** (queries on demand)

---

## GET /responses/:responseId

**Fetch a single response for detail review or audit.**

### Request

```http
GET /responses/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: your-assessment-api.workers.dev
Origin: https://inflownetwork.com
Accept: application/json
```

### Response

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "company": "inflow-network",
  "respondent_name": "Alice Johnson",
  "respondent_email": "alice@inflownetwork.com",
  "department": "Product",
  "role": "Product Manager",
  "ai_maturity_score": 3.33,
  "maturity_level": "Developing",
  "question_responses": [
    {
      "id": "q1",
      "score": 4.0,
      "label": "Are you using AI in product decisions?"
    },
    {
      "id": "q2",
      "score": 3.5,
      "label": "What is your organization's AI maturity level?"
    },
    {
      "id": "q3",
      "score": 2.5,
      "label": "Do you have AI governance policies in place?"
    }
  ],
  "submitted_at": 1713984615,
  "submitted_at_iso": "2026-04-26T22:30:15.000Z"
}
```

### Response Schema

```typescript
interface ResponseDetail {
  id: string;
  company: string;
  respondent_name: string;
  respondent_email: string;
  department: string;
  role: string;
  ai_maturity_score: number;
  maturity_level: string;
  question_responses: Array<{
    id: string;
    score: number;
    label?: string;
  }>;
  submitted_at: number;                    // Unix timestamp (seconds)
  submitted_at_iso: string;                // ISO 8601 for convenience
}
```

### Error Response (404)

```json
{
  "error": "Response not found"
}
```

### Performance

- **Latency**: ~10ms (primary key lookup)

---

## Status Codes Reference

| Code | Meaning | Examples |
|------|---------|----------|
| 200 | OK | Successful submit, dashboard fetch, response detail |
| 204 | No Content | CORS preflight (OPTIONS) |
| 400 | Bad Request | Invalid company slug, missing field, invalid email |
| 403 | Forbidden | CORS violation (origin not allowed) |
| 404 | Not Found | Response ID doesn't exist |
| 405 | Method Not Allowed | Using wrong HTTP method |
| 429 | Too Many Requests | Rate limit exceeded (IP submitted >5 times in 5 min) |
| 500 | Internal Server Error | D1 database error, unhandled exception |

---

## Rate Limiting

### Current Implementation

- **Limit**: 5 submissions per IP per 5 minutes
- **Storage**: Cloudflare KV (key: `form_submission:{ip}`)
- **Response**: 429 with error message

### Example Rate Limit Response

```json
{
  "error": "Too many submissions. Please wait before submitting again."
}
```

### Rate Limit Headers

```
(Not returned, but recorded in KV with TTL: 300 seconds)
```

### Bypassing for Testing

For load testing, either:
1. Use different IP addresses (VPN, different networks)
2. Modify `response-handler.js` → `rateLimit` logic during dev
3. Wait 5 minutes between batches

---

## Content-Type & Encoding

### Requests
- `Content-Type: application/json` (required for POST)
- UTF-8 encoding
- Max payload: 10KB (typical: 2–4KB)

### Responses
- `Content-Type: application/json`
- UTF-8 encoding
- Gzip compression (automatic, handled by Cloudflare)

---

## CORS & Security

### CORS Headers (Response)

```
Access-Control-Allow-Origin: https://inflownetwork.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### Validation

All inputs are validated:
- Company: 1–50 chars, `[a-z0-9-]` only
- Email: Basic regex check
- Scores: 1.0–5.0
- Strings: Max lengths enforced (name: 100, email: 255, etc.)

### No Auth Required
(Assessment forms are typically semi-public. If you need auth, add JWT/OAuth layer.)

---

## Error Handling Best Practices

### Frontend Submission

```javascript
async function submitWithErrorHandling(data) {
  try {
    const response = await fetch('/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.status === 429) {
      return { error: 'Too many submissions. Please wait 5 minutes.' };
    }

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Unknown error' };
    }

    const result = await response.json();
    return { success: true, responseId: result.responseId };

  } catch (error) {
    return { error: 'Network error. Please check your connection.' };
  }
}
```

### Dashboard Fetch with Retry

```javascript
async function fetchDashboardWithRetry(company, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`/analytics/dashboard/${company}`);

      if (response.status === 404) {
        return null;  // Company not found
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * attempt));  // Exponential backoff
    }
  }
}
```

---

## FAQ

### Q: How often is the dashboard updated?
**A**: Cache TTL is 5 minutes. After a submission, the dashboard will show the new response within 5 minutes (or instantly if you clear Cloudflare cache).

### Q: Can I get real-time updates?
**A**: Use polling (fetch `/analytics/dashboard` every 30–60 seconds) or implement soft invalidation (see Architecture doc).

### Q: What if a submission fails?
**A**: 500 error is logged. Contact support with timestamp. Response may or may not be in database (database error logging not implemented in basic version).

### Q: Can I bulk import old responses?
**A**: Yes. Parse old markdown files and POST to `/responses` endpoint. Aggregation happens automatically.

### Q: Is data encrypted?
**A**: In transit (HTTPS). At rest (D1 SQLite, Cloudflare's encryption standard). No encryption key management in this version.

### Q: Can I export to CSV?
**A**: Not in this version. You can query D1 directly or implement an export endpoint in the worker.

---

## Postman Collection

```json
{
  "info": {
    "name": "AI Assessment API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Submit Response",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "url": {
          "raw": "{{base_url}}/responses",
          "host": ["{{base_url}}"],
          "path": ["responses"]
        },
        "body": {
          "mode": "raw",
          "raw": "{ \"company\": \"inflow-network\", ... }"
        }
      }
    },
    {
      "name": "Dashboard",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/analytics/dashboard/inflow-network",
          "host": ["{{base_url}}"],
          "path": ["analytics", "dashboard", "inflow-network"]
        }
      }
    }
  ]
}
```

Set `base_url` to your worker URL in Postman environment.
