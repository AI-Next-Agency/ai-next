# Response Storage & Query Layer - Architecture & Implementation

**Date**: 2026-04-26  
**Project**: AI Assessment Form System  
**Owner**: Nihat (N)  
**Status**: Design Phase

---

## Executive Summary

This document provides a production-grade design for storing and querying assessment form responses in a Cloudflare Worker + D1 (SQLite) stack. The system is designed to:

- **Support flexible company configurations** with versioned question sets
- **Store responses at scale** (10,000+ records) with fast queries
- **Enable advanced filtering** (date range, score range, department, company, etc.)
- **Maintain data consistency** through normalized schemas and foreign key constraints
- **Support future extensibility** without requiring schema changes (JSONB columns, enum patterns)

---

## 1. Database Schema (D1/SQLite)

### Core Philosophy

- **Normalization**: Separate companies, question sets, responses, and individual answers into distinct tables
- **Versioning**: Question sets and company configs are versioned to handle updates without breaking historical data
- **Indexes**: Strategic indexes on frequently queried columns (company_id, created_at, score ranges)
- **Constraints**: Foreign keys to maintain referential integrity across the system

### Schema Design

```sql
-- =====================================================================
-- 1. COMPANIES TABLE
-- =====================================================================
-- Stores organization metadata with versioning support
CREATE TABLE companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  slug TEXT UNIQUE NOT NULL,           -- URL-safe identifier
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  config JSONB DEFAULT '{}',           -- Flexible config: branding, webhooks, etc.
  active BOOLEAN DEFAULT 1
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);


-- =====================================================================
-- 2. QUESTION_SETS TABLE
-- =====================================================================
-- Versioned question definitions (immutable once published)
CREATE TABLE question_sets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  version INT NOT NULL,                 -- e.g., 1, 2, 3 for same company
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  metadata JSONB DEFAULT '{}',          -- scoring_method, min_score, max_score, etc.
  FOREIGN KEY(company_id) REFERENCES companies(id),
  UNIQUE(company_id, version)
);

CREATE INDEX idx_question_sets_company_version 
  ON question_sets(company_id, version DESC);
CREATE INDEX idx_question_sets_active ON question_sets(active);


-- =====================================================================
-- 3. QUESTIONS TABLE
-- =====================================================================
-- Individual questions within a question set
CREATE TABLE questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  question_set_id TEXT NOT NULL,
  external_id TEXT NOT NULL,           -- ID from client (company's internal ID)
  order_index INT NOT NULL,            -- Display order
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'likert',  -- likert, multiple_choice, text, etc.
  scale_min INT DEFAULT 1,
  scale_max INT DEFAULT 5,
  category TEXT,                       -- Optional: group questions by category
  metadata JSONB DEFAULT '{}',         -- weights, conditional logic, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(question_set_id) REFERENCES question_sets(id),
  UNIQUE(question_set_id, external_id)
);

CREATE INDEX idx_questions_question_set 
  ON questions(question_set_id, order_index);
CREATE INDEX idx_questions_category ON questions(category);


-- =====================================================================
-- 4. RESPONSES TABLE
-- =====================================================================
-- Top-level response record (one per form submission)
CREATE TABLE responses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  question_set_id TEXT NOT NULL,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_department TEXT,
  respondent_role TEXT,
  
  -- Derived metrics (computed at insert time for fast filtering)
  average_score REAL,
  min_score INT,
  max_score INT,
  maturity_level TEXT,                 -- e.g., 'beginner', 'intermediate', 'advanced'
  ai_maturity_score INT,               -- Computed overall score
  
  -- Status & timestamps
  status TEXT DEFAULT 'submitted',     -- submitted, processing, flagged, archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Extensibility: store raw submission metadata
  metadata JSONB DEFAULT '{}',         -- ip_address, user_agent, locale, etc.
  custom_fields JSONB DEFAULT '{}',    -- Any company-specific fields
  
  FOREIGN KEY(company_id) REFERENCES companies(id),
  FOREIGN KEY(question_set_id) REFERENCES question_sets(id)
);

CREATE INDEX idx_responses_company ON responses(company_id, created_at DESC);
CREATE INDEX idx_responses_created_at ON responses(created_at DESC);
CREATE INDEX idx_responses_email ON responses(respondent_email);
CREATE INDEX idx_responses_department ON responses(respondent_department);
CREATE INDEX idx_responses_avg_score ON responses(company_id, average_score DESC);
CREATE INDEX idx_responses_maturity ON responses(company_id, maturity_level);
CREATE INDEX idx_responses_status ON responses(company_id, status);


-- =====================================================================
-- 5. ANSWERS TABLE
-- =====================================================================
-- Individual answer to each question (normalized, one row per question per response)
CREATE TABLE answers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  score INT,                            -- 1-5 for Likert scale
  text_answer TEXT,                     -- For open-ended responses
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY(question_id) REFERENCES questions(id)
);

CREATE INDEX idx_answers_response ON answers(response_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_score ON answers(score);


-- =====================================================================
-- 6. WEBHOOKS TABLE (Optional but Recommended)
-- =====================================================================
-- Event-driven delivery for integrations (Slack, email, etc.)
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,            -- response.created, response.updated, etc.
  headers JSONB DEFAULT '{}',          -- Custom headers to include
  retry_count INT DEFAULT 0,
  last_attempted_at DATETIME,
  last_status_code INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE INDEX idx_webhooks_company_event 
  ON webhooks(company_id, event_type, active);


-- =====================================================================
-- 7. AUDIT_LOG TABLE (Optional but Recommended)
-- =====================================================================
-- Track changes for compliance and debugging
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  entity_type TEXT NOT NULL,           -- 'response', 'company', 'question_set'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,                -- 'create', 'update', 'delete', 'export'
  actor TEXT,                          -- user ID or system
  changes JSONB,                       -- before/after for updates
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

---

## 2. API Endpoint Signatures

All endpoints follow REST conventions with JSON request/response bodies.

### Company Management

```
POST   /api/companies
       Request: { slug, name, config }
       Response: { id, slug, name, created_at }

GET    /api/companies/:companyId
       Response: { id, slug, name, config, active, created_at }

PUT    /api/companies/:companyId
       Request: { name, config, active }
       Response: { id, slug, name, ... }

DELETE /api/companies/:companyId
       Response: { success: true }
```

### Question Set Management

```
POST   /api/companies/:companyId/question-sets
       Request: { name, description, questions: [{external_id, question_text, ...}] }
       Response: { id, version, name, published_at }

GET    /api/companies/:companyId/question-sets/:versionOrLatest
       Response: { id, version, name, questions: [...] }

PATCH  /api/companies/:companyId/question-sets/:versionOrLatest
       Request: { questions: [...] }
       Response: { id, version, created_at }
```

### Response Collection

```
POST   /api/companies/:companyId/responses
       Request: {
         name, email, department, role,
         aiMaturityScore, maturityLevel,
         questions: [{ id, score }, ...]
       }
       Response: { id, company_id, created_at, average_score }

GET    /api/companies/:companyId/responses
       Query params:
         - ?dateFrom=2026-01-01&dateTo=2026-04-30
         - ?scoreMin=3&scoreMax=5
         - ?maturityLevel=advanced
         - ?department=engineering
         - ?limit=50&offset=0
         - ?sortBy=created_at&sortOrder=desc
       Response: { 
         total, limit, offset,
         data: [{ id, name, email, average_score, created_at }, ...] 
       }

GET    /api/companies/:companyId/responses/:responseId
       Response: {
         id, company_id, name, email, department, role,
         average_score, ai_maturity_score, maturity_level,
         answers: [{ question_text, score }, ...],
         created_at
       }
```

### Analytics & Export

```
GET    /api/companies/:companyId/analytics
       Query params: ?dateFrom=...&dateTo=...
       Response: {
         total_responses, average_score, score_distribution,
         maturity_level_breakdown, department_breakdown
       }

GET    /api/companies/:companyId/export
       Query params: 
         - ?format=csv
         - ?dateFrom=...&dateTo=...
       Response: CSV stream or { downloadUrl: "s3://..." }
```

---

## 3. Core Worker Implementation: POST /responses

Here's a fully functional handler for the primary ingest endpoint:

```typescript
// src/handlers/responses.ts
import { Router, IRequest } from 'itty-router';
import { D1Database } from '@cloudflare/workers-types';

interface ResponseInput {
  company_id: string;
  name: string;
  email: string;
  department?: string;
  role?: string;
  ai_maturity_score: number;
  maturity_level: string;
  questions: Array<{
    id: string;
    score: number;
  }>;
  metadata?: Record<string, any>;
}

interface ErrorResponse {
  error: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

interface SuccessResponse {
  id: string;
  company_id: string;
  created_at: string;
  average_score: number;
  total_questions: number;
}

/**
 * POST /api/companies/:companyId/responses
 * 
 * Creates a new response record with normalized answer storage.
 * 
 * Validation:
 * - Company exists and is active
 * - Question set is published for the company
 * - All questions in submission match the question set
 * - Scores are within valid range
 * - Email is valid
 * 
 * Process:
 * 1. Validate input and company
 * 2. Look up active question set
 * 3. Validate all question IDs match the question set
 * 4. Create response record
 * 5. Insert individual answers (transaction)
 * 6. Compute and update derived metrics
 * 7. Trigger webhooks if configured
 * 8. Return success with response ID
 */
export async function createResponse(
  request: IRequest,
  env: { DB: D1Database }
): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const body = await request.json<ResponseInput>();

    // =========== Input Validation ===========
    const validation = validateResponseInput(body);
    if (!validation.valid) {
      return createErrorResponse(validation.errors, 'VALIDATION_ERROR', 400);
    }

    // =========== Database Access ===========
    const db = env.DB;

    // Step 1: Verify company exists and is active
    const company = await db
      .prepare('SELECT id, config FROM companies WHERE id = ? AND active = 1')
      .bind(companyId)
      .first();

    if (!company) {
      return createErrorResponse(
        { company_id: 'Company not found or inactive' },
        'COMPANY_NOT_FOUND',
        404
      );
    }

    // Step 2: Get the latest active question set for this company
    const questionSet = await db
      .prepare(`
        SELECT id, version, metadata 
        FROM question_sets 
        WHERE company_id = ? AND active = 1 
        ORDER BY version DESC 
        LIMIT 1
      `)
      .bind(companyId)
      .first();

    if (!questionSet) {
      return createErrorResponse(
        { question_set: 'No active question set for this company' },
        'NO_QUESTION_SET',
        400
      );
    }

    // Step 3: Fetch all questions in the set to validate submission
    const questions = await db
      .prepare(`
        SELECT id, external_id, scale_min, scale_max, category 
        FROM questions 
        WHERE question_set_id = ?
        ORDER BY order_index
      `)
      .bind(questionSet.id)
      .all();

    // Map external_id -> db id for validation and insertion
    const questionMap = new Map(
      (questions.results as any[]).map((q) => [q.external_id, q])
    );

    // Validate: all submitted questions exist in the set
    for (const submission of body.questions) {
      if (!questionMap.has(submission.id)) {
        return createErrorResponse(
          { questions: `Unknown question: ${submission.id}` },
          'INVALID_QUESTION',
          400
        );
      }
      const q = questionMap.get(submission.id);
      if (submission.score < q.scale_min || submission.score > q.scale_max) {
        return createErrorResponse(
          { score: `Score out of range for question ${submission.id}` },
          'INVALID_SCORE',
          400
        );
      }
    }

    // =========== Create Response (with transaction) ===========
    const responseId = generateId();
    const now = new Date().toISOString();

    // Calculate derived metrics
    const scores = body.questions.map((q) => q.score);
    const avgScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Insert response record
    await db
      .prepare(`
        INSERT INTO responses (
          id, company_id, question_set_id, 
          respondent_name, respondent_email, 
          respondent_department, respondent_role,
          average_score, min_score, max_score,
          ai_maturity_score, maturity_level,
          status, created_at, updated_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        responseId,
        companyId,
        questionSet.id,
        body.name,
        body.email,
        body.department || null,
        body.role || null,
        avgScore,
        minScore,
        maxScore,
        body.ai_maturity_score,
        body.maturity_level,
        'submitted',
        now,
        now,
        JSON.stringify(body.metadata || {})
      )
      .run();

    // Insert individual answers
    for (const submission of body.questions) {
      const question = questionMap.get(submission.id);
      const answerId = generateId();
      
      await db
        .prepare(`
          INSERT INTO answers (
            id, response_id, question_id, score, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `)
        .bind(answerId, responseId, question.id, submission.score, now)
        .run();
    }

    // =========== Log to Audit ===========
    await db
      .prepare(`
        INSERT INTO audit_log (
          id, entity_type, entity_id, action, actor, changes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        generateId(),
        'response',
        responseId,
        'create',
        'system',
        JSON.stringify({
          company_id: companyId,
          respondent_email: body.email,
          average_score: avgScore
        }),
        now
      )
      .run();

    // =========== Trigger Webhooks (fire-and-forget) ===========
    // In production, queue these for retry logic
    const webhooks = await db
      .prepare(`
        SELECT url, headers 
        FROM webhooks 
        WHERE company_id = ? AND event_type = 'response.created' AND active = 1
      `)
      .bind(companyId)
      .all();

    if ((webhooks.results as any[]).length > 0) {
      triggerWebhooks(webhooks.results as any[], {
        event: 'response.created',
        response_id: responseId,
        company_id: companyId,
        average_score: avgScore,
        timestamp: now
      }).catch((err) => console.error('Webhook error:', err));
    }

    // =========== Return Success ===========
    return new Response(
      JSON.stringify({
        id: responseId,
        company_id: companyId,
        created_at: now,
        average_score: avgScore,
        total_questions: scores.length,
        status: 'submitted'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Response creation error:', error);
    return createErrorResponse(
      { error: String(error) },
      'INTERNAL_ERROR',
      500
    );
  }
}

// =========== Validation ===========
function validateResponseInput(body: any): {
  valid: boolean;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (!body.email || !isValidEmail(body.email)) {
    errors.email = 'Valid email is required';
  }

  if (typeof body.ai_maturity_score !== 'number' || body.ai_maturity_score < 0 || body.ai_maturity_score > 100) {
    errors.ai_maturity_score = 'AI maturity score must be 0-100';
  }

  if (!body.maturity_level || !['beginner', 'intermediate', 'advanced'].includes(body.maturity_level)) {
    errors.maturity_level = 'Valid maturity level required';
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    errors.questions = 'At least one question answer is required';
  } else {
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      if (!q.id || typeof q.score !== 'number') {
        errors[`questions.${i}`] = 'Each question must have id and numeric score';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function generateId(): string {
  return crypto
    .getRandomValues(new Uint8Array(8))
    .reduce((id, byte) => id + byte.toString(16).padStart(2, '0'), '');
}

function createErrorResponse(
  details: Record<string, any>,
  code: string,
  status: number
): Response {
  return new Response(
    JSON.stringify({ error: code, status, details }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function triggerWebhooks(
  webhooks: any[],
  payload: Record<string, any>
): Promise<void> {
  const promises = webhooks.map((webhook) =>
    fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...JSON.parse(webhook.headers || '{}')
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) console.warn(`Webhook failed: ${res.status}`);
      })
      .catch((err) => console.error('Webhook delivery error:', err))
  );

  await Promise.all(promises);
}
```

---

## 4. Query API Examples

### Example 1: Filter by Date Range & Score

```typescript
// GET /api/companies/abc123/responses?dateFrom=2026-01-01&dateTo=2026-04-30&scoreMin=3.5&scoreMax=5

export async function listResponses(
  request: IRequest,
  env: { DB: D1Database }
): Promise<Response> {
  const companyId = (request as any).params.companyId;
  const url = new URL(request.url);
  
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const scoreMin = parseFloat(url.searchParams.get('scoreMin') || '0');
  const scoreMax = parseFloat(url.searchParams.get('scoreMax') || '5');
  const department = url.searchParams.get('department');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const sortBy = url.searchParams.get('sortBy') || 'created_at';
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  let query = `
    SELECT 
      id, respondent_name, respondent_email, respondent_department,
      respondent_role, average_score, ai_maturity_score, maturity_level,
      created_at
    FROM responses
    WHERE company_id = ?
  `;
  
  const params: any[] = [companyId];

  if (dateFrom) {
    query += ' AND created_at >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    query += ' AND created_at <= ?';
    params.push(dateTo);
  }

  if (scoreMin > 0) {
    query += ' AND average_score >= ?';
    params.push(scoreMin);
  }

  if (scoreMax < 5) {
    query += ' AND average_score <= ?';
    params.push(scoreMax);
  }

  if (department) {
    query += ' AND respondent_department = ?';
    params.push(department);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const results = await env.DB.prepare(query).bind(...params).all();

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM responses WHERE company_id = ?`;
  const countParams: any[] = [companyId];

  if (dateFrom) countParams.push(dateFrom);
  if (dateTo) countParams.push(dateTo);
  if (scoreMin > 0) countParams.push(scoreMin);
  if (scoreMax < 5) countParams.push(scoreMax);
  if (department) countParams.push(department);

  const countResult = await env.DB.prepare(
    countQuery.replace('?', '? AND created_at >= ? AND created_at <= ? AND average_score >= ? AND average_score <= ?').slice(0, countQuery.length)
  ).bind(...countParams).first();

  return new Response(
    JSON.stringify({
      total: countResult?.total || 0,
      limit,
      offset,
      data: results.results || []
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

### Example 2: Analytics Dashboard

```typescript
// GET /api/companies/:companyId/analytics?dateFrom=2026-01-01&dateTo=2026-04-30

export async function getAnalytics(
  request: IRequest,
  env: { DB: D1Database }
): Promise<Response> {
  const companyId = (request as any).params.companyId;
  const url = new URL(request.url);
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');

  const db = env.DB;

  // Aggregate statistics
  const stats = await db
    .prepare(`
      SELECT 
        COUNT(*) as total_responses,
        AVG(average_score) as mean_score,
        MIN(average_score) as min_score,
        MAX(average_score) as max_score,
        STDDEV(average_score) as std_dev
      FROM responses
      WHERE company_id = ?
        ${dateFrom ? 'AND created_at >= ?' : ''}
        ${dateTo ? 'AND created_at <= ?' : ''}
    `)
    .bind(...[companyId, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])])
    .first();

  // Score distribution
  const distribution = await db
    .prepare(`
      SELECT 
        CASE 
          WHEN average_score < 2 THEN '1-2'
          WHEN average_score < 3 THEN '2-3'
          WHEN average_score < 4 THEN '3-4'
          ELSE '4-5'
        END as bucket,
        COUNT(*) as count
      FROM responses
      WHERE company_id = ?
        ${dateFrom ? 'AND created_at >= ?' : ''}
        ${dateTo ? 'AND created_at <= ?' : ''}
      GROUP BY bucket
    `)
    .bind(...[companyId, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])])
    .all();

  // By maturity level
  const byMaturity = await db
    .prepare(`
      SELECT maturity_level, COUNT(*) as count
      FROM responses
      WHERE company_id = ?
        ${dateFrom ? 'AND created_at >= ?' : ''}
        ${dateTo ? 'AND created_at <= ?' : ''}
      GROUP BY maturity_level
    `)
    .bind(...[companyId, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])])
    .all();

  // By department
  const byDepartment = await db
    .prepare(`
      SELECT respondent_department, COUNT(*) as count, AVG(average_score) as avg_score
      FROM responses
      WHERE company_id = ? AND respondent_department IS NOT NULL
        ${dateFrom ? 'AND created_at >= ?' : ''}
        ${dateTo ? 'AND created_at <= ?' : ''}
      GROUP BY respondent_department
      ORDER BY count DESC
    `)
    .bind(...[companyId, ...(dateFrom ? [dateFrom] : []), ...(dateTo ? [dateTo] : [])])
    .all();

  return new Response(
    JSON.stringify({
      summary: stats,
      score_distribution: distribution.results || [],
      by_maturity_level: byMaturity.results || [],
      by_department: byDepartment.results || [],
      query_params: { dateFrom, dateTo }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
```

---

## 5. Handling Complexity & Dependencies

### Question Set Versioning Strategy

When a company updates their question set:

1. **Don't modify existing questions** — create a new version (v1, v2, v3)
2. **Old responses remain tied to v1** via `responses.question_set_id`
3. **New submissions use the latest version** via the "get latest question set" logic
4. **Migrations between versions** are handled by explicit mapping if needed

```typescript
// In the response creation handler:
const questionSet = await db
  .prepare(`
    SELECT id, version FROM question_sets
    WHERE company_id = ? AND active = 1
    ORDER BY version DESC LIMIT 1
  `)
  .bind(companyId)
  .first();

// Every response is forever linked to the specific question set version it was answered with
```

### Handling Question Deletions or Renames

```typescript
// Mark as inactive rather than delete
UPDATE questions SET active = 0 WHERE id = ?;

// Existing answers remain intact
// New question sets don't include inactive questions
```

### Adding Custom Fields Without Schema Changes

Use JSONB columns to extend schemas without migrations:

```typescript
// In responses table:
custom_fields JSONB DEFAULT '{}'

// Usage:
INSERT INTO responses (..., custom_fields) 
VALUES (..., '{"department_code": "ENG-001", "budget_code": "Q2-2026"}')

// Query:
SELECT * FROM responses 
WHERE json_extract(custom_fields, '$.department_code') = 'ENG-001'
```

---

## 6. Scaling Considerations

### Indexing Strategy (Already in Schema)

- **Compound indexes** on frequently filtered columns: `(company_id, created_at)`, `(company_id, average_score)`
- **Separate indexes** for pagination and sorting
- **High-cardinality columns** (email, external IDs) get single indexes

### Query Optimization

1. **Always include company_id** in WHERE clauses — it's the first column in composite indexes
2. **Use pagination** — default limit 50, max 100
3. **Avoid SELECT \*** — specify columns needed
4. **Materialized metrics** — compute average_score at insert time, not query time

### Batch Operations

For bulk exports or migrations:

```typescript
// Batch insert (e.g., from CSV) — recommended chunk size 1000
const BATCH_SIZE = 1000;
for (let i = 0; i < responses.length; i += BATCH_SIZE) {
  const batch = responses.slice(i, i + BATCH_SIZE);
  // Insert batch with transaction
}
```

---

## 7. Extension Points & Future Features

### 1. **Dynamic Scoring Weights**

Store in `question_sets.metadata`:
```json
{
  "scoring_method": "weighted_average",
  "weights": {
    "leadership": 0.3,
    "technical": 0.4,
    "culture": 0.3
  }
}
```

### 2. **Conditional Questions**

In `questions.metadata`:
```json
{
  "condition": "if_previous_score < 3",
  "depends_on_question": "q1"
}
```

### 3. **Multi-Language Support**

Add `question_sets.language` and translations in JSONB:
```json
{
  "en": "Do you use AI tools?",
  "tr": "AI araçlarını kullanıyor musunuz?"
}
```

### 4. **Real-Time Webhooks**

Already in schema — expand webhook types:
- `response.created`
- `response.updated`
- `batch_export_ready`
- `anomaly_detected` (if score is >2 std devs from mean)

### 5. **Report Templates**

New table:
```sql
CREATE TABLE report_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  name TEXT,
  config JSONB,  -- { filters: {...}, visualizations: [...] }
  created_at DATETIME,
  FOREIGN KEY(company_id) REFERENCES companies(id)
);
```

---

## 8. Migration Plan

### Phase 1: Core (Week 1)
- [x] Schema design (this document)
- [ ] Implement D1 schema
- [ ] POST /responses endpoint
- [ ] GET /responses list + filtering

### Phase 2: Admin (Week 2)
- [ ] Company CRUD
- [ ] Question set management
- [ ] Simple analytics

### Phase 3: Advanced (Week 3)
- [ ] Webhook integration
- [ ] Export to CSV
- [ ] Bulk operations
- [ ] Audit logging

### Phase 4: Optimization (Week 4+)
- [ ] Performance testing (10k+ records)
- [ ] Index tuning
- [ ] Caching layer
- [ ] Rate limiting

---

## 9. Error Handling & Edge Cases

| Case | Handling |
|------|----------|
| Duplicate email in same company | Allow (person answers twice) — use timestamps to identify updates |
| Company deleted | Soft delete — mark inactive, keep history |
| Question removed from set | Mark inactive — old responses still link correctly |
| Score out of range | Reject with 400 + field error |
| Invalid company ID | Return 404 immediately |
| Concurrent submissions | Timestamps + IDs ensure no conflicts |

---

## 10. Security Considerations

1. **Validation**: All inputs validated before DB insert
2. **SQL Injection**: Use prepared statements (all examples do)
3. **Authentication**: Add middleware to verify API key / JWT
4. **Rate Limiting**: Implement per-company rate limits
5. **CORS**: Restrict to known domains (company website)
6. **Data Isolation**: All queries filtered by company_id
7. **Audit Trail**: All mutations logged to audit_log

---

## Summary

This design provides:

- **Flexibility**: JSONB columns + versioning support future changes
- **Scalability**: Proper indexing + normalization for 10k+ records
- **Reliability**: Foreign keys + transaction support
- **Extensibility**: Question versioning, custom fields, webhooks
- **Observability**: Audit logging + analytics endpoints

The schema is production-ready. Start with Phase 1 and extend as needed.
