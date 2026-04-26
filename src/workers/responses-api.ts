import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  API_SECRET: string;
  ORIGINS: string[];
}

interface FormSubmission {
  company: string;
  name: string;
  email: string;
  department: string;
  role: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
    score: number;
  }>;
  aiMaturityScore: number;
  maturityLevel: string;
}

interface DashboardData {
  company: string;
  totalResponses: number;
  avgScore: number;
  submissionTimeline: Array<{ date: string; count: number; avgScore: number }>;
  maturityDistribution: Record<string, number>;
  scoreDistribution: Record<string, number>;
  questionMetrics: Array<{ questionId: string; title: string; avgScore: number; responseCount: number }>;
  recentResponses: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    score: number;
    maturityLevel: string;
    submittedAt: string;
  }>;
}

const app = new Hono<{ Bindings: Env }>();

// CORS Configuration
app.use('/*', cors({
  origin: ['https://ai-next-agency.github.io', 'https://inflownetwork.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check (no auth required)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST: Submit assessment response
app.post('/api/responses', async (c) => {
  const env = c.env as Env;

  try {
    const body = await c.req.json() as FormSubmission;

    // Validation
    if (!body.company || !body.name || !body.email || !body.department || !body.role) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return c.json({ success: false, error: 'No questions provided' }, 400);
    }

    // Validate company exists
    const companyCheck = await env.DB.prepare('SELECT id FROM companies WHERE slug = ?').bind(body.company).first();
    if (!companyCheck) {
      return c.json({ success: false, error: 'Invalid company' }, 400);
    }

    const companyId = (companyCheck as any).id;
    const responseId = crypto.randomUUID();
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Start transaction: Insert response
    const insertResponse = await env.DB.prepare(`
      INSERT INTO responses (
        id, company_id, respondent_name, respondent_email,
        department, role, ai_maturity_score, maturity_level,
        response_data, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      responseId,
      companyId,
      body.name,
      body.email,
      body.department,
      body.role,
      body.aiMaturityScore,
      body.maturityLevel,
      JSON.stringify(body),
      now,
      now
    ).run();

    // Insert individual answers
    const answerPromises = body.questions.map((q) => {
      const answerId = crypto.randomUUID();
      return env.DB.prepare(`
        INSERT INTO answers (id, response_id, question_id, selected_value, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(answerId, responseId, q.id, q.score, now).run();
    });

    await Promise.all(answerPromises);

    // Update aggregates
    // 1. Daily metrics
    const dailyMetric = await env.DB.prepare(`
      SELECT count FROM company_daily_metrics WHERE company_id = ? AND date = ?
    `).bind(companyId, today).first();

    if (dailyMetric) {
      await env.DB.prepare(`
        UPDATE company_daily_metrics
        SET submission_count = submission_count + 1,
            avg_score = (
              SELECT AVG(ai_maturity_score) FROM responses
              WHERE company_id = ? AND DATE(submitted_at) = ?
            ),
            updated_at = ?
        WHERE company_id = ? AND date = ?
      `).bind(companyId, today, now, companyId, today).run();
    } else {
      const metricId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO company_daily_metrics (id, company_id, date, submission_count, avg_score, updated_at)
        VALUES (?, ?, ?, 1, ?, ?)
      `).bind(metricId, companyId, today, body.aiMaturityScore, now).run();
    }

    // 2. Maturity distribution
    const maturityRecord = await env.DB.prepare(`
      SELECT count FROM company_maturity_distribution
      WHERE company_id = ? AND maturity_level = ?
    `).bind(companyId, body.maturityLevel).first();

    if (maturityRecord) {
      await env.DB.prepare(`
        UPDATE company_maturity_distribution
        SET count = count + 1, updated_at = ?
        WHERE company_id = ? AND maturity_level = ?
      `).bind(now, companyId, body.maturityLevel).run();
    } else {
      const distId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO company_maturity_distribution (id, company_id, maturity_level, count, updated_at)
        VALUES (?, ?, ?, 1, ?)
      `).bind(distId, companyId, body.maturityLevel, now).run();
    }

    // 3. Score distribution
    const scoreBucket = getScoreBucket(body.aiMaturityScore);
    const scoreRecord = await env.DB.prepare(`
      SELECT count FROM company_score_distribution
      WHERE company_id = ? AND score_bucket = ?
    `).bind(companyId, scoreBucket).first();

    if (scoreRecord) {
      await env.DB.prepare(`
        UPDATE company_score_distribution
        SET count = count + 1, updated_at = ?
        WHERE company_id = ? AND score_bucket = ?
      `).bind(now, companyId, scoreBucket).run();
    } else {
      const scoreId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO company_score_distribution (id, company_id, score_bucket, count, updated_at)
        VALUES (?, ?, ?, 1, ?)
      `).bind(scoreId, companyId, scoreBucket, now).run();
    }

    // 4. Question metrics (per-question averages)
    for (const q of body.questions) {
      const qMetric = await env.DB.prepare(`
        SELECT response_count FROM company_question_metrics
        WHERE company_id = ? AND question_id = ?
      `).bind(companyId, q.id).first();

      if (qMetric) {
        await env.DB.prepare(`
          UPDATE company_question_metrics
          SET avg_score = (
            SELECT AVG(selected_value) FROM answers
            WHERE question_id = ? AND response_id IN (
              SELECT id FROM responses WHERE company_id = ?
            )
          ),
          response_count = response_count + 1,
          updated_at = ?
          WHERE company_id = ? AND question_id = ?
        `).bind(q.id, companyId, now, companyId, q.id).run();
      } else {
        const qMetricId = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO company_question_metrics (id, company_id, question_id, avg_score, response_count, updated_at)
          VALUES (?, ?, ?, ?, 1, ?)
        `).bind(qMetricId, companyId, q.id, q.score, now).run();
      }
    }

    return c.json({
      success: true,
      responseId,
      message: 'Assessment submitted successfully',
      timestamp: now,
    }, 201);

  } catch (error) {
    console.error('Error submitting response:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// GET: Fetch dashboard data (requires auth)
app.get('/api/analytics/dashboard', bearerAuth({ token: (c) => c.env.API_SECRET }), async (c) => {
  const env = c.env as Env;
  const companySlug = c.req.query('company');

  if (!companySlug) {
    return c.json({ error: 'Missing company parameter' }, 400);
  }

  try {
    // Get company ID
    const company = await env.DB.prepare(`
      SELECT id, name FROM companies WHERE slug = ?
    `).bind(companySlug).first();

    if (!company) {
      return c.json({ error: 'Company not found' }, 404);
    }

    const companyId = (company as any).id;

    // Fetch all dashboard data in parallel
    const [totalResponses, timeline, maturityDist, scoreDist, questionMetrics, recentResponses] = await Promise.all([
      // Total responses
      env.DB.prepare(`
        SELECT COUNT(*) as count FROM responses WHERE company_id = ?
      `).bind(companyId).first(),

      // Timeline (last 30 days)
      env.DB.prepare(`
        SELECT
          DATE(submitted_at) as date,
          COUNT(*) as count,
          AVG(ai_maturity_score) as avgScore
        FROM responses
        WHERE company_id = ? AND submitted_at >= datetime('now', '-30 days')
        GROUP BY DATE(submitted_at)
        ORDER BY date DESC
      `).bind(companyId).all(),

      // Maturity distribution
      env.DB.prepare(`
        SELECT maturity_level, count FROM company_maturity_distribution
        WHERE company_id = ?
        ORDER BY maturity_level
      `).bind(companyId).all(),

      // Score distribution
      env.DB.prepare(`
        SELECT score_bucket, count FROM company_score_distribution
        WHERE company_id = ?
        ORDER BY score_bucket
      `).bind(companyId).all(),

      // Question metrics
      env.DB.prepare(`
        SELECT q.question_id, q.title, m.avg_score, m.response_count
        FROM company_question_metrics m
        JOIN questions q ON m.question_id = q.question_id
        WHERE m.company_id = ?
        ORDER BY q.question_id
      `).bind(companyId).all(),

      // Recent responses
      env.DB.prepare(`
        SELECT
          id, respondent_name as name, respondent_email as email,
          department, role, ai_maturity_score as score,
          maturity_level, submitted_at
        FROM responses
        WHERE company_id = ?
        ORDER BY submitted_at DESC
        LIMIT 10
      `).bind(companyId).all(),
    ]);

    // Format response
    const dashboard: DashboardData = {
      company: companySlug,
      totalResponses: (totalResponses as any).count || 0,
      avgScore: 0,
      submissionTimeline: (timeline as any[]).map((t: any) => ({
        date: t.date,
        count: t.count,
        avgScore: parseFloat(t.avgScore || 0),
      })),
      maturityDistribution: Object.fromEntries(
        (maturityDist as any[]).map((m: any) => [m.maturity_level, m.count])
      ),
      scoreDistribution: Object.fromEntries(
        (scoreDist as any[]).map((s: any) => [s.score_bucket, s.count])
      ),
      questionMetrics: (questionMetrics as any[]).map((q: any) => ({
        questionId: q.question_id,
        title: q.title,
        avgScore: parseFloat(q.avg_score || 0),
        responseCount: q.response_count,
      })),
      recentResponses: (recentResponses as any[]).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        department: r.department,
        role: r.role,
        score: r.score,
        maturityLevel: r.maturity_level,
        submittedAt: r.submitted_at,
      })),
    };

    // Calculate overall average
    if (dashboard.totalResponses > 0) {
      const avgResult = await env.DB.prepare(`
        SELECT AVG(ai_maturity_score) as avg FROM responses WHERE company_id = ?
      `).bind(companyId).first();
      dashboard.avgScore = parseFloat((avgResult as any).avg || 0);
    }

    return c.json(dashboard);

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET: Fetch individual response
app.get('/api/responses/:id', bearerAuth({ token: (c) => c.env.API_SECRET }), async (c) => {
  const env = c.env as Env;
  const responseId = c.req.param('id');

  try {
    const response = await env.DB.prepare(`
      SELECT * FROM responses WHERE id = ?
    `).bind(responseId).first();

    if (!response) {
      return c.json({ error: 'Response not found' }, 404);
    }

    // Fetch answers
    const answers = await env.DB.prepare(`
      SELECT question_id, selected_value FROM answers WHERE response_id = ?
    `).bind(responseId).all();

    return c.json({
      ...response,
      answers: answers as any[],
    });

  } catch (error) {
    console.error('Error fetching response:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET: List responses with filtering
app.get('/api/responses', bearerAuth({ token: (c) => c.env.API_SECRET }), async (c) => {
  const env = c.env as Env;
  const companySlug = c.req.query('company');
  const dateFrom = c.req.query('date_from');
  const dateTo = c.req.query('date_to');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  if (!companySlug) {
    return c.json({ error: 'Missing company parameter' }, 400);
  }

  try {
    // Get company ID
    const company = await env.DB.prepare(`
      SELECT id FROM companies WHERE slug = ?
    `).bind(companySlug).first();

    if (!company) {
      return c.json({ error: 'Company not found' }, 404);
    }

    const companyId = (company as any).id;

    // Build query
    let query = `SELECT * FROM responses WHERE company_id = ?`;
    const params: any[] = [companyId];

    if (dateFrom) {
      query += ` AND submitted_at >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND submitted_at <= ?`;
      params.push(dateTo);
    }

    query += ` ORDER BY submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const responses = await env.DB.prepare(query).bind(...params).all();

    // Count total
    let countQuery = `SELECT COUNT(*) as count FROM responses WHERE company_id = ?`;
    const countParams: any[] = [companyId];

    if (dateFrom) {
      countQuery += ` AND submitted_at >= ?`;
      countParams.push(dateFrom);
    }

    if (dateTo) {
      countQuery += ` AND submitted_at <= ?`;
      countParams.push(dateTo);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return c.json({
      total: (countResult as any).count,
      limit,
      offset,
      data: responses,
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper function: Calculate score bucket
function getScoreBucket(score: number): string {
  if (score <= 1.5) return '1-1.5';
  if (score <= 2) return '1.5-2';
  if (score <= 2.5) return '2-2.5';
  if (score <= 3) return '2.5-3';
  if (score <= 3.5) return '3-3.5';
  if (score <= 4) return '3.5-4';
  if (score <= 4.5) return '4-4.5';
  return '4.5-5';
}

export default app;
