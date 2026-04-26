/**
 * Cloudflare Worker: Minimalist Assessment Response API
 *
 * Single responsibility: Receive assessment form submissions, store in D1,
 * expose queryable API for dashboards.
 *
 * Deploy: wrangler deploy
 * Bindings required in wrangler.toml:
 *   - DB: D1 database
 *   - API_SECRET: Bearer token for dashboard queries (optional)
 */

import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types
// ============================================================================

interface Env {
  DB: D1Database;
  API_SECRET?: string;
}

interface FormSubmission {
  company: string;
  name: string;
  email: string;
  department: string;
  role: string;
  aiMaturityScore: number;
  maturityLevel: string;
  questions: Array<{ id: string; score: number }>;
}

interface ValidationResult {
  ok: boolean;
  error?: string;
  field?: string;
}

interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

// ============================================================================
// App Setup
// ============================================================================

const app = new Hono<{ Bindings: Env }>();

// Middleware: CORS
app.use('*', (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') {
    return c.text('');
  }
  return next();
});

// Middleware: Optional auth for sensitive endpoints
const requireAuth = (c: any, next: any) => {
  const env = c.env as Env;
  if (env.API_SECRET) {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return c.json({ ok: false, error: 'unauthorized' }, 401);
    }
    const token = auth.slice(7);
    if (token !== env.API_SECRET) {
      return c.json({ ok: false, error: 'invalid_token' }, 401);
    }
  }
  return next();
};

// ============================================================================
// Validation
// ============================================================================

function validateSubmission(body: any): ValidationResult {
  const required = [
    'company',
    'name',
    'email',
    'department',
    'role',
    'aiMaturityScore',
    'maturityLevel',
    'questions',
  ];

  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { ok: false, error: 'missing_required_field', field };
    }
  }

  // Type checks
  if (typeof body.company !== 'string' || body.company.length === 0) {
    return { ok: false, error: 'invalid_company' };
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { ok: false, error: 'invalid_name' };
  }

  if (!isValidEmail(body.email)) {
    return { ok: false, error: 'invalid_email' };
  }

  if (typeof body.department !== 'string' || body.department.trim().length === 0) {
    return { ok: false, error: 'invalid_department' };
  }

  if (typeof body.role !== 'string' || body.role.trim().length === 0) {
    return { ok: false, error: 'invalid_role' };
  }

  // Score validation
  const score = Number(body.aiMaturityScore);
  if (isNaN(score) || score < 0 || score > 5) {
    return { ok: false, error: 'invalid_ai_maturity_score' };
  }

  if (typeof body.maturityLevel !== 'string' || body.maturityLevel.trim().length === 0) {
    return { ok: false, error: 'invalid_maturity_level' };
  }

  // Questions array validation
  if (!Array.isArray(body.questions)) {
    return { ok: false, error: 'questions_must_be_array' };
  }

  if (body.questions.length === 0) {
    return { ok: false, error: 'questions_empty' };
  }

  for (let i = 0; i < body.questions.length; i++) {
    const q = body.questions[i];
    if (typeof q.id !== 'string' || q.id.trim().length === 0) {
      return { ok: false, error: `invalid_question_id_at_index_${i}` };
    }
    const qScore = Number(q.score);
    if (isNaN(qScore) || qScore < 1 || qScore > 5) {
      return { ok: false, error: `invalid_question_score_at_index_${i}` };
    }
  }

  return { ok: true };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = prefix + '_';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ============================================================================
// Endpoints
// ============================================================================

/**
 * POST /api/responses
 * Receive and store a form submission
 */
app.post('/api/responses', async (c) => {
  try {
    const db = c.env.DB;
    const body = await c.req.json().catch(() => null);

    if (!body) {
      return c.json({ ok: false, error: 'invalid_json' }, 400);
    }

    // Validate
    const validation = validateSubmission(body);
    if (!validation.ok) {
      return c.json(
        {
          ok: false,
          error: validation.error,
          ...(validation.field && { field: validation.field }),
        },
        400
      );
    }

    const submission = body as FormSubmission;

    // Verify company exists
    const companyRow = await db
      .prepare('SELECT company_id, question_count FROM companies WHERE company_id = ?')
      .bind(submission.company)
      .first<{ company_id: string; question_count: number }>();

    if (!companyRow) {
      return c.json({ ok: false, error: 'company_not_found' }, 400);
    }

    // Validate question count
    if (submission.questions.length !== companyRow.question_count) {
      return c.json(
        {
          ok: false,
          error: 'invalid_question_count',
          expected: companyRow.question_count,
          received: submission.questions.length,
        },
        400
      );
    }

    // Check for duplicate email in last 24h (optional throttling)
    const recent = await db
      .prepare(
        `SELECT response_id FROM responses
         WHERE company_id = ? AND email = ? AND created_at > datetime('now', '-1 day')
         LIMIT 1`
      )
      .bind(submission.company, submission.email)
      .first<{ response_id: string }>();

    if (recent) {
      return c.json(
        {
          ok: false,
          error: 'duplicate_submission',
          message: 'You have already submitted a response in the last 24 hours. Please try again tomorrow.',
        },
        409
      );
    }

    // Prepare insert
    const responseId = generateId('resp');
    const questionsJson = JSON.stringify(submission.questions);
    const metadataJson = JSON.stringify({
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip'),
      timestamp: new Date().toISOString(),
    });

    // Insert
    await db
      .prepare(
        `INSERT INTO responses
         (response_id, company_id, name, email, department, role, ai_maturity_score, maturity_level, questions_json, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        responseId,
        submission.company,
        submission.name.trim(),
        submission.email.toLowerCase(),
        submission.department.trim(),
        submission.role.trim(),
        submission.aiMaturityScore,
        submission.maturityLevel.toLowerCase(),
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
    console.error('POST /api/responses error:', err);
    return c.json({ ok: false, error: 'internal_error' }, 500);
  }
});

/**
 * GET /api/responses
 * List responses with optional filtering
 * Query params: company, maturity_level, department, email, limit, offset
 */
app.get('/api/responses', requireAuth, async (c) => {
  try {
    const db = c.env.DB;
    const company = c.req.query('company');
    const maturityLevel = c.req.query('maturity_level');
    const department = c.req.query('department');
    const email = c.req.query('email');
    const limitParam = parseInt(c.req.query('limit') || '20');
    const offsetParam = parseInt(c.req.query('offset') || '0');

    const limit = Math.min(Math.max(limitParam, 1), 100); // Clamp 1-100
    const offset = Math.max(offsetParam, 0);

    // Validate company required
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

    // Build WHERE clause
    const params: any[] = [company];
    let whereClause = 'WHERE company_id = ?';

    if (maturityLevel) {
      whereClause += ' AND maturity_level = ?';
      params.push(maturityLevel.toLowerCase());
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (email) {
      whereClause += ' AND email = ?';
      params.push(email.toLowerCase());
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

    const queryParams = [...params];

    if (!email) {
      // Only paginate if not doing exact email match
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
    }

    const rows = await db.prepare(query).bind(...queryParams).all<any>();

    return c.json({
      ok: true,
      company,
      total,
      limit,
      offset,
      count: rows.results.length,
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
  } catch (err) {
    console.error('GET /api/responses error:', err);
    return c.json({ ok: false, error: 'internal_error' }, 500);
  }
});

/**
 * GET /api/responses/:responseId
 * Get single response with question titles
 * Query param: company (required)
 */
app.get('/api/responses/:responseId', requireAuth, async (c) => {
  try {
    const db = c.env.DB;
    const responseId = c.req.param('responseId');
    const company = c.req.query('company');

    if (!company) {
      return c.json({ ok: false, error: 'company_required' }, 400);
    }

    const row = await db
      .prepare(`SELECT * FROM responses WHERE response_id = ? AND company_id = ?`)
      .bind(responseId, company)
      .first<any>();

    if (!row) {
      return c.json({ ok: false, error: 'not_found' }, 404);
    }

    // Parse questions array
    let questions: Array<{ id: string; score: number }> = [];
    try {
      questions = JSON.parse(row.questions_json);
    } catch (e) {
      console.error('Failed to parse questions_json:', e);
    }

    // Fetch question titles
    if (questions.length > 0) {
      const questionIds = questions.map((q) => q.id);
      const questionRows = await db
        .prepare(
          `SELECT question_id, title FROM questions
           WHERE company_id = ? AND question_id IN (${questionIds.map(() => '?').join(',')})`
        )
        .bind(company, ...questionIds)
        .all<any>();

      const titleMap = new Map(
        questionRows.results.map((q: any) => [q.question_id, q.title])
      );

      questions = questions.map((q) => ({
        id: q.id,
        title: titleMap.get(q.id) || '(unknown)',
        score: q.score,
      }));
    }

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
        questions,
      },
    });
  } catch (err) {
    console.error('GET /api/responses/:id error:', err);
    return c.json({ ok: false, error: 'internal_error' }, 500);
  }
});

/**
 * GET /api/responses/stats/:company
 * Aggregate stats (count, average score, distribution)
 * Query params: department (optional)
 */
app.get('/api/responses/stats/:company', requireAuth, async (c) => {
  try {
    const db = c.env.DB;
    const company = c.req.param('company');
    const department = c.req.query('department');

    // Verify company exists
    const companyExists = await db
      .prepare('SELECT 1 FROM companies WHERE company_id = ?')
      .bind(company)
      .first();

    if (!companyExists) {
      return c.json({ ok: false, error: 'company_not_found' }, 400);
    }

    // Build WHERE clause
    const params: any[] = [company];
    let whereClause = 'WHERE company_id = ?';

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    // Get total count and average
    const summary = await db
      .prepare(
        `SELECT
          COUNT(*) as total,
          AVG(ai_maturity_score) as avg_score,
          MIN(ai_maturity_score) as min_score,
          MAX(ai_maturity_score) as max_score
        FROM responses ${whereClause}`
      )
      .bind(...params)
      .first<any>();

    // Get distribution by maturity level
    const distribution = await db
      .prepare(
        `SELECT
          maturity_level,
          COUNT(*) as count
        FROM responses ${whereClause}
        GROUP BY maturity_level
        ORDER BY maturity_level`
      )
      .bind(...params)
      .all<any>();

    const distributionMap: Record<string, number> = {};
    distribution.results.forEach((row: any) => {
      distributionMap[row.maturity_level] = row.count;
    });

    return c.json({
      ok: true,
      company,
      filters: department ? { department } : {},
      stats: {
        total: summary?.total || 0,
        avgScore: summary?.avg_score ? Math.round(summary.avg_score * 100) / 100 : 0,
        minScore: summary?.min_score || 0,
        maxScore: summary?.max_score || 0,
        distribution: distributionMap,
      },
    });
  } catch (err) {
    console.error('GET /api/responses/stats error:', err);
    return c.json({ ok: false, error: 'internal_error' }, 500);
  }
});

/**
 * GET /api/health
 * Health check (no auth required)
 */
app.get('/api/health', async (c) => {
  return c.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// Error handlers
// ============================================================================

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      ok: false,
      error: 'internal_error',
      message: err instanceof Error ? err.message : 'Unknown error',
    },
    500
  );
});

app.notFound((c) => {
  return c.json({ ok: false, error: 'not_found' }, 404);
});

// ============================================================================
// Export
// ============================================================================

export default app;
