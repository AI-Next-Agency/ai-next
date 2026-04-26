/**
 * Complete Worker Implementation: Response Storage & Query Layer
 *
 * This file contains production-ready endpoint handlers for the
 * AI assessment form response system.
 *
 * Usage in wrangler.toml:
 * - Add D1 binding: [[d1_databases]]
 *   binding = "DB"
 *   database_name = "assessment_db"
 *   database_id = "..." (from wrangler d1 create)
 *
 * Usage in main worker:
 * - Import handlers and attach to router
 * - Set up middleware for error handling and logging
 */

import { Router, IRequest } from 'itty-router';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

interface Env {
  DB: D1Database;
  SECRET_API_KEY?: string; // Optional: for API key validation
}

interface ResponseInput {
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

interface Company {
  id: string;
  slug: string;
  name: string;
  config: Record<string, any>;
  active: boolean;
  created_at: string;
}

interface QuestionSet {
  id: string;
  company_id: string;
  version: number;
  name: string;
  description?: string;
  questions: Question[];
}

interface Question {
  id: string;
  external_id: string;
  question_text: string;
  question_type: string;
  scale_min: number;
  scale_max: number;
  category?: string;
}

interface Response {
  id: string;
  company_id: string;
  question_set_id: string;
  respondent_name: string;
  respondent_email: string;
  respondent_department?: string;
  respondent_role?: string;
  average_score: number;
  ai_maturity_score: number;
  maturity_level: string;
  created_at: string;
}

interface ErrorResponse {
  error: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

function generateId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createErrorResponse(
  details: Record<string, any>,
  code: string,
  status: number
): Response {
  return new Response(
    JSON.stringify({
      error: code,
      status,
      details,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// =====================================================================
// VALIDATION FUNCTIONS
// =====================================================================

function validateResponseInput(body: any): {
  valid: boolean;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Name validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required and must be a non-empty string';
  }

  // Email validation
  if (!body.email || !isValidEmail(body.email)) {
    errors.email = 'Valid email address is required';
  }

  // AI maturity score validation
  if (
    typeof body.ai_maturity_score !== 'number' ||
    body.ai_maturity_score < 0 ||
    body.ai_maturity_score > 100
  ) {
    errors.ai_maturity_score = 'AI maturity score must be between 0 and 100';
  }

  // Maturity level validation
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  if (!body.maturity_level || !validLevels.includes(body.maturity_level)) {
    errors.maturity_level = `Maturity level must be one of: ${validLevels.join(', ')}`;
  }

  // Questions validation
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    errors.questions = 'At least one question answer is required';
  } else {
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];
      if (!q.id || typeof q.id !== 'string') {
        errors[`questions[${i}].id`] = 'Question ID is required and must be a string';
      }
      if (typeof q.score !== 'number') {
        errors[`questions[${i}].score`] = 'Score must be a number';
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

function validateCompanyInput(body: any): {
  valid: boolean;
  errors?: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!body.slug || typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug)) {
    errors.slug = 'Slug is required, must be lowercase alphanumeric with hyphens only';
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required and must be a non-empty string';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

// =====================================================================
// COMPANY ENDPOINTS
// =====================================================================

/**
 * POST /api/companies
 * Create a new company
 */
export async function createCompany(
  request: IRequest,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json();

    const validation = validateCompanyInput(body);
    if (!validation.valid) {
      return createErrorResponse(validation.errors || {}, 'VALIDATION_ERROR', 400);
    }

    const companyId = generateId();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO companies (id, slug, name, created_at, updated_at, config, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `)
      .bind(companyId, body.slug, body.name, now, now, JSON.stringify(body.config || {}))
      .run();

    // Log to audit
    await env.DB.prepare(`
      INSERT INTO audit_log (id, entity_type, entity_id, action, actor, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(generateId(), 'company', companyId, 'create', 'system', now)
      .run();

    return createSuccessResponse(
      {
        id: companyId,
        slug: body.slug,
        name: body.name,
        created_at: now
      },
      201
    );
  } catch (error) {
    console.error('Company creation error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/companies/:companyId
 * Get company details
 */
export async function getCompany(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;

    const company = await env.DB.prepare(`
      SELECT id, slug, name, config, active, created_at, updated_at
      FROM companies
      WHERE id = ?
    `)
      .bind(companyId)
      .first();

    if (!company) {
      return createErrorResponse({ company_id: 'Company not found' }, 'NOT_FOUND', 404);
    }

    return createSuccessResponse({
      ...company,
      config: typeof company.config === 'string' ? JSON.parse(company.config) : company.config
    });
  } catch (error) {
    console.error('Company fetch error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

/**
 * PUT /api/companies/:companyId
 * Update company
 */
export async function updateCompany(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const body = await request.json();

    const now = new Date().toISOString();

    const result = await env.DB.prepare(`
      UPDATE companies
      SET name = COALESCE(?, name),
          config = COALESCE(?, config),
          active = COALESCE(?, active),
          updated_at = ?
      WHERE id = ?
    `)
      .bind(
        body.name || null,
        body.config ? JSON.stringify(body.config) : null,
        body.active !== undefined ? (body.active ? 1 : 0) : null,
        now,
        companyId
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      return createErrorResponse({ company_id: 'Company not found' }, 'NOT_FOUND', 404);
    }

    // Log to audit
    await env.DB.prepare(`
      INSERT INTO audit_log (id, entity_type, entity_id, action, actor, changes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(generateId(), 'company', companyId, 'update', 'system', JSON.stringify(body), now)
      .run();

    return createSuccessResponse({ success: true, updated_at: now });
  } catch (error) {
    console.error('Company update error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

// =====================================================================
// QUESTION SET ENDPOINTS
// =====================================================================

/**
 * POST /api/companies/:companyId/question-sets
 * Create a new question set version
 */
export async function createQuestionSet(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const body = await request.json();

    // Verify company exists
    const company = await env.DB.prepare(`
      SELECT id FROM companies WHERE id = ? AND active = 1
    `)
      .bind(companyId)
      .first();

    if (!company) {
      return createErrorResponse({ company_id: 'Company not found or inactive' }, 'NOT_FOUND', 404);
    }

    // Get next version number
    const lastVersion = await env.DB.prepare(`
      SELECT MAX(version) as max_version FROM question_sets WHERE company_id = ?
    `)
      .bind(companyId)
      .first();

    const nextVersion = (lastVersion?.max_version || 0) + 1;
    const questionSetId = generateId();
    const now = new Date().toISOString();

    // Insert question set
    await env.DB.prepare(`
      INSERT INTO question_sets (id, company_id, version, name, description, active, created_at, published_at, metadata)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `)
      .bind(
        questionSetId,
        companyId,
        nextVersion,
        body.name,
        body.description || null,
        now,
        now,
        JSON.stringify(body.metadata || {})
      )
      .run();

    // Insert questions
    if (Array.isArray(body.questions)) {
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
        await env.DB.prepare(`
          INSERT INTO questions (
            id, question_set_id, external_id, order_index, question_text,
            question_type, scale_min, scale_max, category, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            generateId(),
            questionSetId,
            q.id,
            i,
            q.text,
            q.type || 'likert',
            q.scale_min || 1,
            q.scale_max || 5,
            q.category || null,
            JSON.stringify(q.metadata || {}),
            now
          )
          .run();
      }
    }

    // Log to audit
    await env.DB.prepare(`
      INSERT INTO audit_log (id, entity_type, entity_id, action, actor, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .bind(generateId(), 'question_set', questionSetId, 'create', 'system', now)
      .run();

    return createSuccessResponse(
      {
        id: questionSetId,
        company_id: companyId,
        version: nextVersion,
        name: body.name,
        published_at: now
      },
      201
    );
  } catch (error) {
    console.error('Question set creation error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/companies/:companyId/question-sets/:version
 * Get question set by version (or 'latest')
 */
export async function getQuestionSet(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const version = (request as any).params.version;

    let query = `
      SELECT id, company_id, version, name, description, metadata, created_at
      FROM question_sets
      WHERE company_id = ?
    `;

    const params: any[] = [companyId];

    if (version === 'latest') {
      query += ' ORDER BY version DESC LIMIT 1';
    } else {
      query += ' AND version = ?';
      params.push(parseInt(version));
    }

    const questionSet = await env.DB.prepare(query).bind(...params).first();

    if (!questionSet) {
      return createErrorResponse({ question_set: 'Question set not found' }, 'NOT_FOUND', 404);
    }

    // Fetch questions
    const questionsResult = await env.DB.prepare(`
      SELECT id, external_id, question_text, question_type, scale_min, scale_max, category
      FROM questions
      WHERE question_set_id = ?
      ORDER BY order_index
    `)
      .bind(questionSet.id)
      .all();

    return createSuccessResponse({
      ...questionSet,
      metadata: typeof questionSet.metadata === 'string' ? JSON.parse(questionSet.metadata) : questionSet.metadata,
      questions: questionsResult.results || []
    });
  } catch (error) {
    console.error('Question set fetch error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

// =====================================================================
// RESPONSE ENDPOINTS
// =====================================================================

/**
 * POST /api/companies/:companyId/responses
 *
 * Create a new response with normalized answer storage.
 * This is the primary ingest endpoint.
 */
export async function createResponse(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const body = await request.json<ResponseInput>();

    // ========== INPUT VALIDATION ==========
    const validation = validateResponseInput(body);
    if (!validation.valid) {
      return createErrorResponse(validation.errors || {}, 'VALIDATION_ERROR', 400);
    }

    // ========== COMPANY VERIFICATION ==========
    const company = await env.DB.prepare(`
      SELECT id, config FROM companies WHERE id = ? AND active = 1
    `)
      .bind(companyId)
      .first();

    if (!company) {
      return createErrorResponse(
        { company_id: 'Company not found or inactive' },
        'COMPANY_NOT_FOUND',
        404
      );
    }

    // ========== GET LATEST QUESTION SET ==========
    const questionSet = await env.DB.prepare(`
      SELECT id, version, metadata FROM question_sets
      WHERE company_id = ? AND active = 1
      ORDER BY version DESC LIMIT 1
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

    // ========== FETCH & VALIDATE QUESTIONS ==========
    const questionsResult = await env.DB.prepare(`
      SELECT id, external_id, scale_min, scale_max, category FROM questions
      WHERE question_set_id = ?
      ORDER BY order_index
    `)
      .bind(questionSet.id)
      .all();

    const questions = (questionsResult.results as any[]) || [];
    const questionMap = new Map(questions.map((q) => [q.external_id, q]));

    // Validate all submitted questions exist in the set
    for (const submission of body.questions) {
      const question = questionMap.get(submission.id);
      if (!question) {
        return createErrorResponse(
          { questions: `Unknown question: ${submission.id}` },
          'INVALID_QUESTION',
          400
        );
      }
      if (submission.score < question.scale_min || submission.score > question.scale_max) {
        return createErrorResponse(
          { score: `Score for question ${submission.id} out of range (${question.scale_min}-${question.scale_max})` },
          'INVALID_SCORE',
          400
        );
      }
    }

    // ========== CREATE RESPONSE RECORD ==========
    const responseId = generateId();
    const now = new Date().toISOString();

    // Calculate derived metrics
    const scores = body.questions.map((q) => q.score);
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Insert response
    await env.DB.prepare(`
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

    // ========== INSERT INDIVIDUAL ANSWERS ==========
    for (const submission of body.questions) {
      const question = questionMap.get(submission.id);
      await env.DB.prepare(`
        INSERT INTO answers (id, response_id, question_id, score, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
        .bind(generateId(), responseId, question.id, submission.score, now)
        .run();
    }

    // ========== LOG TO AUDIT ==========
    await env.DB.prepare(`
      INSERT INTO audit_log (id, entity_type, entity_id, action, actor, changes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
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

    // ========== TRIGGER WEBHOOKS ==========
    // Fire-and-forget: webhooks are queued for async delivery
    triggerWebhooks(env, companyId, {
      event: 'response.created',
      response_id: responseId,
      company_id: companyId,
      average_score: avgScore,
      timestamp: now
    }).catch((err) => console.error('Webhook error:', err));

    // ========== RETURN SUCCESS ==========
    return createSuccessResponse(
      {
        id: responseId,
        company_id: companyId,
        created_at: now,
        average_score: avgScore,
        total_questions: scores.length,
        status: 'submitted'
      },
      201
    );

  } catch (error) {
    console.error('Response creation error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/companies/:companyId/responses
 *
 * List responses with advanced filtering and pagination.
 *
 * Query parameters:
 * - dateFrom: ISO date string (inclusive)
 * - dateTo: ISO date string (inclusive)
 * - scoreMin: minimum average score (0-5)
 * - scoreMax: maximum average score (0-5)
 * - department: filter by department
 * - maturityLevel: filter by maturity level
 * - limit: max results (default 50, max 100)
 * - offset: pagination offset (default 0)
 * - sortBy: field to sort by (created_at, average_score, etc.)
 * - sortOrder: asc or desc (default desc)
 */
export async function listResponses(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const url = new URL(request.url);

    // Parse query parameters
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const scoreMin = parseFloat(url.searchParams.get('scoreMin') || '0');
    const scoreMax = parseFloat(url.searchParams.get('scoreMax') || '5');
    const department = url.searchParams.get('department');
    const maturityLevel = url.searchParams.get('maturityLevel');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Validate sortBy to prevent injection
    const allowedSortFields = [
      'created_at',
      'average_score',
      'ai_maturity_score',
      'respondent_name'
    ];
    if (!allowedSortFields.includes(sortBy)) {
      return createErrorResponse(
        { sortBy: `Invalid sort field. Must be one of: ${allowedSortFields.join(', ')}` },
        'VALIDATION_ERROR',
        400
      );
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return createErrorResponse(
        { sortOrder: 'Sort order must be asc or desc' },
        'VALIDATION_ERROR',
        400
      );
    }

    // Build query
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

    if (maturityLevel) {
      query += ' AND maturity_level = ?';
      params.push(maturityLevel);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const results = await env.DB.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM responses WHERE company_id = ?`;
    const countParams: any[] = [companyId];

    if (dateFrom) {
      countQuery += ' AND created_at >= ?';
      countParams.push(dateFrom);
    }
    if (dateTo) {
      countQuery += ' AND created_at <= ?';
      countParams.push(dateTo);
    }
    if (scoreMin > 0) {
      countQuery += ' AND average_score >= ?';
      countParams.push(scoreMin);
    }
    if (scoreMax < 5) {
      countQuery += ' AND average_score <= ?';
      countParams.push(scoreMax);
    }
    if (department) {
      countQuery += ' AND respondent_department = ?';
      countParams.push(department);
    }
    if (maturityLevel) {
      countQuery += ' AND maturity_level = ?';
      countParams.push(maturityLevel);
    }

    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    return createSuccessResponse({
      total: (countResult as any)?.total || 0,
      limit,
      offset,
      has_more: (countResult as any)?.total > offset + limit,
      data: results.results || [],
      filters: {
        dateFrom,
        dateTo,
        scoreMin,
        scoreMax,
        department,
        maturityLevel
      }
    });

  } catch (error) {
    console.error('Response list error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/companies/:companyId/responses/:responseId
 * Get detailed response with all answers
 */
export async function getResponse(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const responseId = (request as any).params.responseId;

    const response = await env.DB.prepare(`
      SELECT
        id, company_id, question_set_id, respondent_name, respondent_email,
        respondent_department, respondent_role, average_score, ai_maturity_score,
        maturity_level, created_at, metadata
      FROM responses
      WHERE id = ? AND company_id = ?
    `)
      .bind(responseId, companyId)
      .first();

    if (!response) {
      return createErrorResponse({ response_id: 'Response not found' }, 'NOT_FOUND', 404);
    }

    // Fetch answers with question text
    const answersResult = await env.DB.prepare(`
      SELECT q.question_text, q.category, a.score, a.created_at
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.response_id = ?
      ORDER BY q.order_index
    `)
      .bind(responseId)
      .all();

    return createSuccessResponse({
      ...response,
      metadata: typeof response.metadata === 'string' ? JSON.parse(response.metadata) : response.metadata,
      answers: answersResult.results || []
    });

  } catch (error) {
    console.error('Response fetch error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

// =====================================================================
// ANALYTICS ENDPOINTS
// =====================================================================

/**
 * GET /api/companies/:companyId/analytics
 * Get aggregated analytics for the company
 */
export async function getAnalytics(request: IRequest, env: Env): Promise<Response> {
  try {
    const companyId = (request as any).params.companyId;
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Base query filters
    let whereClause = 'WHERE company_id = ?';
    const params: any[] = [companyId];

    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(dateTo);
    }

    // Summary statistics
    const stats = await env.DB.prepare(`
      SELECT
        COUNT(*) as total_responses,
        AVG(average_score) as mean_score,
        MIN(average_score) as min_score,
        MAX(average_score) as max_score
      FROM responses ${whereClause}
    `)
      .bind(...params)
      .first();

    // Score distribution
    const distribution = await env.DB.prepare(`
      SELECT
        CASE
          WHEN average_score < 2 THEN '1.0-2.0'
          WHEN average_score < 3 THEN '2.0-3.0'
          WHEN average_score < 4 THEN '3.0-4.0'
          ELSE '4.0-5.0'
        END as bucket,
        COUNT(*) as count
      FROM responses ${whereClause}
      GROUP BY bucket
      ORDER BY bucket
    `)
      .bind(...params)
      .all();

    // By maturity level
    const byMaturity = await env.DB.prepare(`
      SELECT maturity_level, COUNT(*) as count, ROUND(AVG(average_score), 2) as avg_score
      FROM responses ${whereClause}
      GROUP BY maturity_level
      ORDER BY count DESC
    `)
      .bind(...params)
      .all();

    // By department
    const byDepartment = await env.DB.prepare(`
      SELECT
        respondent_department as department,
        COUNT(*) as count,
        ROUND(AVG(average_score), 2) as avg_score
      FROM responses
      ${whereClause} AND respondent_department IS NOT NULL
      GROUP BY respondent_department
      ORDER BY count DESC
    `)
      .bind(...params)
      .all();

    return createSuccessResponse({
      summary: stats,
      score_distribution: distribution.results || [],
      by_maturity_level: byMaturity.results || [],
      by_department: byDepartment.results || [],
      query_period: { dateFrom, dateTo }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return createErrorResponse({ error: String(error) }, 'INTERNAL_ERROR', 500);
  }
}

// =====================================================================
// HELPER: WEBHOOK TRIGGERING
// =====================================================================

async function triggerWebhooks(
  env: Env,
  companyId: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await env.DB.prepare(`
      SELECT url, headers FROM webhooks
      WHERE company_id = ? AND event_type = 'response.created' AND active = 1
    `)
      .bind(companyId)
      .all();

    const promises = (webhooks.results as any[]).map((webhook) =>
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.headers ? JSON.parse(webhook.headers) : {})
        },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) {
            console.warn(`Webhook failed: ${res.status} at ${webhook.url}`);
          }
        })
        .catch((err) => console.error('Webhook delivery error:', err))
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Webhook fetch error:', error);
  }
}

// =====================================================================
// ROUTER SETUP (use in your main worker)
// =====================================================================

export function createRouter(): Router {
  const router = new Router();

  // Company endpoints
  router.post('/api/companies', createCompany);
  router.get('/api/companies/:companyId', getCompany);
  router.put('/api/companies/:companyId', updateCompany);

  // Question set endpoints
  router.post('/api/companies/:companyId/question-sets', createQuestionSet);
  router.get('/api/companies/:companyId/question-sets/:version', getQuestionSet);

  // Response endpoints
  router.post('/api/companies/:companyId/responses', createResponse);
  router.get('/api/companies/:companyId/responses', listResponses);
  router.get('/api/companies/:companyId/responses/:responseId', getResponse);

  // Analytics
  router.get('/api/companies/:companyId/analytics', getAnalytics);

  return router;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const router = createRouter();
    return router.handle(request, env);
  }
};
