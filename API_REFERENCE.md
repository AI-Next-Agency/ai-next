# API Reference: Assessment Response Layer

Complete REST API documentation with examples.

**Base URL**: `https://assessment-api.example.com`

---

## Authentication

Currently not implemented. Add API key validation middleware for production:

```typescript
// Middleware to add to worker
function requireApiKey(request: IRequest, env: Env): boolean {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  return apiKey === env.SECRET_API_KEY;
}
```

---

## Company Management

### Create Company

Creates a new company account.

**Request**:
```
POST /api/companies
Content-Type: application/json

{
  "slug": "acme-corp",                    // Required: URL-safe identifier
  "name": "ACME Corporation",             // Required: Display name
  "config": {                             // Optional: Custom configuration
    "industry": "technology",
    "size": "500-1000",
    "webhooks_enabled": true,
    "custom_branding": {
      "logo_url": "https://...",
      "primary_color": "#1a73e8"
    }
  }
}
```

**Response** (201):
```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "slug": "acme-corp",
  "name": "ACME Corporation",
  "created_at": "2026-04-26T10:00:00Z"
}
```

**Error** (400):
```json
{
  "error": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "slug": "Slug is required, must be lowercase alphanumeric with hyphens only",
    "name": "Name is required"
  }
}
```

---

### Get Company

Retrieve company details.

**Request**:
```
GET /api/companies/:companyId
```

**Response** (200):
```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "slug": "acme-corp",
  "name": "ACME Corporation",
  "config": {
    "industry": "technology",
    "size": "500-1000"
  },
  "active": true,
  "created_at": "2026-04-26T10:00:00Z",
  "updated_at": "2026-04-26T10:00:00Z"
}
```

**Error** (404):
```json
{
  "error": "NOT_FOUND",
  "status": 404,
  "details": { "company_id": "Company not found" }
}
```

---

### Update Company

Update company details or configuration.

**Request**:
```
PUT /api/companies/:companyId
Content-Type: application/json

{
  "name": "ACME Corporation - Updated",
  "config": {
    "industry": "technology",
    "size": "1000-5000"
  },
  "active": true
}
```

**Response** (200):
```json
{
  "success": true,
  "updated_at": "2026-04-26T10:05:00Z"
}
```

---

## Question Sets

### Create Question Set

Create a versioned question set for a company.

**Request**:
```
POST /api/companies/:companyId/question-sets
Content-Type: application/json

{
  "name": "AI Maturity Assessment v1",
  "description": "Evaluate team AI competency",
  "metadata": {
    "scoring_method": "average",
    "min_score": 1,
    "max_score": 5,
    "estimated_time_minutes": 10
  },
  "questions": [
    {
      "id": "q1",                               // Your external ID
      "text": "How familiar are you with AI tools?",
      "type": "likert",
      "scale_min": 1,
      "scale_max": 5,
      "category": "ai-tools",
      "metadata": { "weight": 0.5 }
    },
    {
      "id": "q2",
      "text": "How often do you use code generation?",
      "type": "likert",
      "scale_min": 1,
      "scale_max": 5,
      "category": "ai-tools",
      "metadata": { "weight": 0.5 }
    },
    {
      "id": "q3",
      "text": "Rate your prompt engineering skills",
      "type": "likert",
      "scale_min": 1,
      "scale_max": 5,
      "category": "skills"
    }
  ]
}
```

**Response** (201):
```json
{
  "id": "qs1a2b3c4d5e6f7g",
  "company_id": "a1b2c3d4e5f6g7h8",
  "version": 1,
  "name": "AI Maturity Assessment v1",
  "published_at": "2026-04-26T10:05:00Z"
}
```

**Key Points**:
- Version auto-increments (v1, v2, v3, etc.)
- Old versions remain available for historical responses
- New questions are added to the new version only

---

### Get Question Set

Retrieve a question set by version or latest.

**Request**:
```
GET /api/companies/:companyId/question-sets/latest
GET /api/companies/:companyId/question-sets/1
GET /api/companies/:companyId/question-sets/2
```

**Response** (200):
```json
{
  "id": "qs1a2b3c4d5e6f7g",
  "company_id": "a1b2c3d4e5f6g7h8",
  "version": 1,
  "name": "AI Maturity Assessment v1",
  "description": "Evaluate team AI competency",
  "metadata": {
    "scoring_method": "average"
  },
  "created_at": "2026-04-26T10:05:00Z",
  "questions": [
    {
      "id": "q1a2b3c4d5e6f7g8",  // Internal ID for storage
      "external_id": "q1",       // Your external ID
      "question_text": "How familiar are you with AI tools?",
      "question_type": "likert",
      "scale_min": 1,
      "scale_max": 5,
      "category": "ai-tools"
    },
    // ... more questions
  ]
}
```

---

## Responses

### Submit Response

Submit a completed assessment form.

**Request**:
```
POST /api/companies/:companyId/responses
Content-Type: application/json

{
  "name": "Alice Johnson",                    // Required
  "email": "alice@acme.com",                  // Required: valid email
  "department": "Engineering",                // Optional
  "role": "Senior Engineer",                  // Optional
  "ai_maturity_score": 72,                    // Required: 0-100
  "maturity_level": "intermediate",           // Required: beginner|intermediate|advanced
  "questions": [                              // Required: non-empty array
    {
      "id": "q1",                             // External question ID
      "score": 4                              // Number: must match scale range
    },
    {
      "id": "q2",
      "score": 3
    },
    {
      "id": "q3",
      "score": 4
    }
  ],
  "metadata": {                               // Optional: any custom data
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "locale": "en-US",
    "session_id": "sess_abc123"
  }
}
```

**Response** (201):
```json
{
  "id": "resp1a2b3c4d5e6f7g",
  "company_id": "a1b2c3d4e5f6g7h8",
  "created_at": "2026-04-26T10:10:00Z",
  "average_score": 3.67,
  "total_questions": 3,
  "status": "submitted"
}
```

**Validation Errors** (400):
```json
{
  "error": "VALIDATION_ERROR",
  "status": 400,
  "details": {
    "name": "Name is required",
    "email": "Valid email is required",
    "ai_maturity_score": "AI maturity score must be between 0 and 100",
    "questions": "At least one question answer is required",
    "questions[0].score": "Score out of range"
  }
}
```

---

### List Responses

Query responses with advanced filtering and pagination.

**Request**:
```
GET /api/companies/:companyId/responses

Query Parameters:
  dateFrom=2026-01-01              // ISO date (inclusive)
  dateTo=2026-12-31                // ISO date (inclusive)
  scoreMin=3.0                      // Minimum average score
  scoreMax=5.0                      // Maximum average score
  department=Engineering            // Exact match on department
  maturityLevel=intermediate        // Exact match on maturity level
  limit=50                          // Max results (default 50, max 100)
  offset=0                          // Pagination offset
  sortBy=created_at                 // created_at, average_score, etc.
  sortOrder=desc                    // asc or desc
```

**Examples**:
```
# Get all responses
GET /api/companies/:companyId/responses

# Filter by date range
GET /api/companies/:companyId/responses?dateFrom=2026-01-01&dateTo=2026-12-31

# High performers (score 4+)
GET /api/companies/:companyId/responses?scoreMin=4.0

# Engineering department only
GET /api/companies/:companyId/responses?department=Engineering

# Intermediate+ skills, pagination
GET /api/companies/:companyId/responses?maturityLevel=intermediate&limit=20&offset=40

# Combined filters
GET /api/companies/:companyId/responses?dateFrom=2026-04-01&scorMin=3&department=Engineering&sortBy=average_score&sortOrder=desc&limit=10
```

**Response** (200):
```json
{
  "total": 127,
  "limit": 50,
  "offset": 0,
  "has_more": true,
  "data": [
    {
      "id": "resp1a2b3c4d5e6f7g",
      "respondent_name": "Alice Johnson",
      "respondent_email": "alice@acme.com",
      "respondent_department": "Engineering",
      "respondent_role": "Senior Engineer",
      "average_score": 3.67,
      "ai_maturity_score": 72,
      "maturity_level": "intermediate",
      "created_at": "2026-04-26T10:10:00Z"
    },
    {
      "id": "resp2b3c4d5e6f7g8h",
      "respondent_name": "Bob Smith",
      "respondent_email": "bob@acme.com",
      "respondent_department": "Marketing",
      "respondent_role": "Product Manager",
      "average_score": 2.33,
      "ai_maturity_score": 45,
      "maturity_level": "beginner",
      "created_at": "2026-04-26T09:50:00Z"
    }
    // ... more responses
  ],
  "filters": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-12-31",
    "scoreMin": 3,
    "scoreMax": 5,
    "department": "Engineering"
  }
}
```

---

### Get Response Details

Retrieve full response with all answers.

**Request**:
```
GET /api/companies/:companyId/responses/:responseId
```

**Response** (200):
```json
{
  "id": "resp1a2b3c4d5e6f7g",
  "company_id": "a1b2c3d4e5f6g7h8",
  "question_set_id": "qs1a2b3c4d5e6f7g",
  "respondent_name": "Alice Johnson",
  "respondent_email": "alice@acme.com",
  "respondent_department": "Engineering",
  "respondent_role": "Senior Engineer",
  "average_score": 3.67,
  "ai_maturity_score": 72,
  "maturity_level": "intermediate",
  "created_at": "2026-04-26T10:10:00Z",
  "metadata": {
    "ip_address": "192.168.1.1",
    "locale": "en-US"
  },
  "answers": [
    {
      "question_text": "How familiar are you with AI tools?",
      "category": "ai-tools",
      "score": 4,
      "created_at": "2026-04-26T10:10:00Z"
    },
    {
      "question_text": "How often do you use code generation?",
      "category": "ai-tools",
      "score": 3,
      "created_at": "2026-04-26T10:10:00Z"
    },
    {
      "question_text": "Rate your prompt engineering skills",
      "category": "skills",
      "score": 4,
      "created_at": "2026-04-26T10:10:00Z"
    }
  ]
}
```

---

## Analytics

### Get Company Analytics

Aggregated statistics across all responses.

**Request**:
```
GET /api/companies/:companyId/analytics

Query Parameters:
  dateFrom=2026-01-01              // ISO date (inclusive)
  dateTo=2026-12-31                // ISO date (inclusive)
```

**Examples**:
```
# All-time analytics
GET /api/companies/:companyId/analytics

# Q1 2026 only
GET /api/companies/:companyId/analytics?dateFrom=2026-01-01&dateTo=2026-03-31

# Last 30 days
GET /api/companies/:companyId/analytics?dateFrom=2026-03-27&dateTo=2026-04-26
```

**Response** (200):
```json
{
  "summary": {
    "total_responses": 127,
    "mean_score": 3.42,
    "min_score": 1.5,
    "max_score": 5.0
  },
  "score_distribution": [
    { "bucket": "1.0-2.0", "count": 12 },
    { "bucket": "2.0-3.0", "count": 35 },
    { "bucket": "3.0-4.0", "count": 45 },
    { "bucket": "4.0-5.0", "count": 35 }
  ],
  "by_maturity_level": [
    { "maturity_level": "intermediate", "count": 65, "avg_score": 3.52 },
    { "maturity_level": "beginner", "count": 45, "avg_score": 2.89 },
    { "maturity_level": "advanced", "count": 17, "avg_score": 4.31 }
  ],
  "by_department": [
    { "department": "Engineering", "count": 52, "avg_score": 3.89 },
    { "department": "Product", "count": 35, "avg_score": 3.12 },
    { "department": "Marketing", "count": 28, "avg_score": 2.76 },
    { "department": "Sales", "count": 12, "avg_score": 2.33 }
  ],
  "query_period": {
    "dateFrom": "2026-01-01",
    "dateTo": "2026-12-31"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "status": 400,
  "details": {
    "field_name": "Human-readable error message"
  },
  "timestamp": "2026-04-26T10:10:00Z"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| COMPANY_NOT_FOUND | 404 | Company doesn't exist or is inactive |
| NOT_FOUND | 404 | Resource not found |
| NO_QUESTION_SET | 400 | Company has no active question set |
| INVALID_QUESTION | 400 | Question ID doesn't exist in set |
| INVALID_SCORE | 400 | Score out of valid range |
| INVALID_FORMAT | 400 | Invalid format parameter |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

Not yet implemented. Recommended:
- 100 requests/minute per API key
- 1000 requests/minute per company
- 10,000 requests/minute total

---

## Webhooks

Register webhooks to receive real-time notifications.

### Register Webhook

```
POST /api/companies/:companyId/webhooks

{
  "url": "https://your-app.example.com/webhook",
  "event_type": "response.created",
  "headers": {
    "X-API-Key": "your-secret-key"
  }
}
```

### Webhook Payload

When a response is submitted:

```json
{
  "event": "response.created",
  "response_id": "resp1a2b3c4d5e6f7g",
  "company_id": "a1b2c3d4e5f6g7h8",
  "average_score": 3.67,
  "timestamp": "2026-04-26T10:10:00Z"
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://assessment-api.example.com';
const COMPANY_ID = 'a1b2c3d4e5f6g7h8';

async function submitResponse(response) {
  const result = await fetch(
    `${API_BASE}/api/companies/${COMPANY_ID}/responses`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    }
  );

  if (!result.ok) {
    const error = await result.json();
    throw new Error(error.error);
  }

  return result.json();
}

async function getAnalytics(dateFrom, dateTo) {
  const params = new URLSearchParams({
    dateFrom,
    dateTo
  });

  const result = await fetch(
    `${API_BASE}/api/companies/${COMPANY_ID}/analytics?${params}`
  );

  return result.json();
}

// Usage
const responseId = await submitResponse({
  name: 'Alice',
  email: 'alice@example.com',
  ai_maturity_score: 72,
  maturity_level: 'intermediate',
  questions: [
    { id: 'q1', score: 4 },
    { id: 'q2', score: 3 }
  ]
});

const analytics = await getAnalytics('2026-01-01', '2026-12-31');
console.log(`Average score: ${analytics.summary.mean_score}`);
```

### Python

```python
import requests
from datetime import datetime

API_BASE = 'https://assessment-api.example.com'
COMPANY_ID = 'a1b2c3d4e5f6g7h8'

def submit_response(response_data):
    response = requests.post(
        f'{API_BASE}/api/companies/{COMPANY_ID}/responses',
        json=response_data
    )
    response.raise_for_status()
    return response.json()

def get_analytics(date_from, date_to):
    response = requests.get(
        f'{API_BASE}/api/companies/{COMPANY_ID}/analytics',
        params={
            'dateFrom': date_from,
            'dateTo': date_to
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
result = submit_response({
    'name': 'Alice',
    'email': 'alice@example.com',
    'ai_maturity_score': 72,
    'maturity_level': 'intermediate',
    'questions': [
        {'id': 'q1', 'score': 4},
        {'id': 'q2', 'score': 3}
    ]
})
print(f"Response ID: {result['id']}")

analytics = get_analytics('2026-01-01', '2026-12-31')
print(f"Mean score: {analytics['summary']['mean_score']}")
```

---

## Changelog

### v1.0.0 (2026-04-26)
- Initial release
- Company management
- Question set versioning
- Response collection & querying
- Analytics API
- Webhook support (infrastructure ready)

---

## Support

For issues or questions:
- Review schema documentation: `assessment-response-layer.md`
- Check implementation guide: `IMPLEMENTATION_GUIDE.md`
- Open issue on GitHub: [project-repo]
