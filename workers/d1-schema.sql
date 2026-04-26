-- ============================================================================
-- Dashboard-First Response Storage & Analytics Schema
-- Cloudflare D1 SQLite Database
--
-- Design Principle: Pre-aggregated metrics tables updated on every submission
-- for zero-latency dashboard queries. Trade write complexity for read speed.
-- ============================================================================

-- ============================================================================
-- 1. CORE RESPONSE TABLE (Source of Truth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,                          -- UUID, generated on insert
  company TEXT NOT NULL,                        -- Company slug (e.g., 'inflow-network')
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  department TEXT,
  role TEXT,

  -- Maturity assessment data
  ai_maturity_score REAL NOT NULL,              -- 1.0–5.0 scale
  maturity_level TEXT NOT NULL,                 -- 'Initial', 'Beginner', 'Developing', 'Advanced', 'Optimized'

  -- Question responses (JSON for flexibility, can denormalize later)
  -- Structure: [{ id: string, score: number, label?: string }, ...]
  question_responses TEXT NOT NULL,             -- JSON array

  -- Timestamps
  submitted_at INTEGER NOT NULL,                -- Unix timestamp (seconds)
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  -- Metadata for debugging/auditing
  ip_address TEXT,                              -- For rate limit tracking
  user_agent TEXT,

  -- Soft delete support
  deleted_at INTEGER,                           -- NULL = active

  -- Indexes for common queries
  UNIQUE(company, respondent_email, submitted_at),  -- Prevent exact duplicates in time window
  INDEX idx_company_submitted ON (company, submitted_at DESC),
  INDEX idx_company_maturity ON (company, maturity_level),
  INDEX idx_company_created ON (company, created_at DESC)
);

-- ============================================================================
-- 2. PRE-AGGREGATED METRICS TABLES (Updated on every submission)
-- ============================================================================

-- Daily metrics by company (denormalized for dashboard speed)
CREATE TABLE IF NOT EXISTS company_daily_metrics (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  metric_date TEXT NOT NULL,                    -- YYYY-MM-DD

  -- Submission counts
  submission_count INTEGER DEFAULT 0,
  unique_respondents INTEGER DEFAULT 0,

  -- Score statistics
  avg_maturity_score REAL,
  min_maturity_score REAL,
  max_maturity_score REAL,
  stddev_maturity_score REAL,

  -- Per-question avg scores (JSON: { question_id: avg_score })
  question_avg_scores TEXT,

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  UNIQUE(company, metric_date),
  INDEX idx_company_date ON (company, metric_date DESC)
);

-- Maturity level distribution (absolute counts)
CREATE TABLE IF NOT EXISTS company_maturity_distribution (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  maturity_level TEXT NOT NULL,

  -- Count of responses at this level (aggregated across all time)
  count INTEGER DEFAULT 0,

  -- Percentage of total (easier than calculating in frontend)
  percentage REAL,

  -- Last 7-day count (for trend)
  count_7d INTEGER DEFAULT 0,

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  UNIQUE(company, maturity_level),
  INDEX idx_company ON (company)
);

-- Score distribution histogram (for visualization)
-- Buckets: [1.0-1.5), [1.5-2.0), [2.0-2.5), [2.5-3.0), [3.0-3.5), [3.5-4.0), [4.0-4.5), [4.5-5.0]
CREATE TABLE IF NOT EXISTS company_score_distribution (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  bucket_min REAL NOT NULL,                     -- e.g., 1.0
  bucket_max REAL NOT NULL,                     -- e.g., 1.5
  bucket_label TEXT NOT NULL,                   -- e.g., '1.0–1.5'

  -- Count of responses falling in this bucket
  count INTEGER DEFAULT 0,

  -- Percentage of total
  percentage REAL,

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  UNIQUE(company, bucket_min, bucket_max),
  INDEX idx_company ON (company)
);

-- Per-question performance (for breakdown charts)
CREATE TABLE IF NOT EXISTS company_question_metrics (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_label TEXT,

  -- Statistics
  avg_score REAL,
  count_responses INTEGER DEFAULT 0,
  distribution_by_score TEXT,                   -- JSON: { "1": 5, "2": 10, ... }

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  UNIQUE(company, question_id),
  INDEX idx_company ON (company)
);

-- Time series aggregates (for trend charts)
CREATE TABLE IF NOT EXISTS company_submission_timeline (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,

  -- Time bucket (hourly, daily, weekly)
  bucket_type TEXT NOT NULL,                    -- 'hourly', 'daily', 'weekly'
  bucket_start INTEGER NOT NULL,                -- Unix timestamp
  bucket_label TEXT NOT NULL,                   -- e.g., '2026-04-26' or 'W17-2026'

  -- Submission activity
  submission_count INTEGER DEFAULT 0,
  unique_respondents INTEGER DEFAULT 0,

  -- Aggregated scores
  avg_maturity_score REAL,

  -- Last updated
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),

  UNIQUE(company, bucket_type, bucket_start),
  INDEX idx_company_type ON (company, bucket_type, bucket_start DESC)
);

-- ============================================================================
-- 3. CACHING & INVALIDATION METADATA
-- ============================================================================

-- Track which aggregates need rebuilding (soft invalidation strategy)
CREATE TABLE IF NOT EXISTS aggregate_invalidation (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,                 -- 'daily_metrics', 'maturity_dist', 'score_dist', 'question_metrics', 'timeline'

  invalidated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
  reason TEXT,                                  -- e.g., 'new_submission', 'manual_rebuild'

  INDEX idx_company_type ON (company, aggregate_type),
  INDEX idx_company ON (company)
);

-- Execution log for audit trail
CREATE TABLE IF NOT EXISTS aggregate_execution_log (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  company TEXT NOT NULL,

  started_at INTEGER NOT NULL,
  completed_at INTEGER,

  status TEXT NOT NULL,                         -- 'in_progress', 'success', 'failed'
  rows_affected INTEGER,
  error_message TEXT,

  INDEX idx_company_type ON (company, aggregate_type, completed_at DESC)
);

-- ============================================================================
-- 4. INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Already defined inline above, but summarized:
-- - responses: (company, submitted_at DESC), (company, maturity_level), (company, created_at DESC)
-- - company_*_metrics: (company) and (company, date/type, ..., DESC)
-- - aggregate_invalidation: (company, aggregate_type)

-- ============================================================================
-- 5. VIEWS FOR CONVENIENCE
-- ============================================================================

-- Last 7 days of responses for a company
CREATE VIEW IF NOT EXISTS v_recent_responses_7d AS
SELECT
  id, company, respondent_name, respondent_email,
  ai_maturity_score, maturity_level,
  submitted_at,
  datetime(submitted_at, 'unixepoch') as submitted_at_iso
FROM responses
WHERE deleted_at IS NULL
  AND submitted_at > CAST(strftime('%s', 'now', '-7 days') AS INTEGER)
ORDER BY submitted_at DESC;

-- Dashboard summary: latest aggregate stats per company
CREATE VIEW IF NOT EXISTS v_company_dashboard_summary AS
SELECT
  r.company,
  COUNT(DISTINCT r.id) as total_responses,
  COUNT(DISTINCT DATE(datetime(r.submitted_at, 'unixepoch'))) as active_days,
  ROUND(AVG(r.ai_maturity_score), 2) as avg_maturity_score,
  MAX(r.ai_maturity_score) as max_maturity_score,
  MIN(r.ai_maturity_score) as min_maturity_score,

  -- Mode (most common maturity level)
  (
    SELECT maturity_level
    FROM responses AS r2
    WHERE r2.company = r.company AND r2.deleted_at IS NULL
    GROUP BY maturity_level
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as mode_maturity_level,

  MAX(r.submitted_at) as last_response_at,
  MAX(r.created_at) as updated_at
FROM responses r
WHERE r.deleted_at IS NULL
GROUP BY r.company;

-- ============================================================================
-- 6. TRIGGER FOR AUTOMATIC AGGREGATION (conceptual — implement in Worker)
-- ============================================================================

-- NOTE: SQLite triggers could auto-update aggregates, but Cloudflare D1
-- doesn't support triggers. Instead, implement aggregation logic in the
-- Worker's POST /responses handler (see worker-response-handler.js).
--
-- Trigger flow on INSERT:
--  1. Insert into responses
--  2. Update company_daily_metrics (or create if date bucket new)
--  3. Update company_maturity_distribution
--  4. Update company_score_distribution
--  5. Update company_question_metrics
--  6. Update company_submission_timeline (hourly, daily, weekly buckets)
--  7. Invalidate aggregates for this company (mark for cache expiration)
