-- =====================================================================
-- AI Assessment Form System - D1/SQLite Schema
-- =====================================================================
-- Run these migrations to set up the database schema.
--
-- Usage in wrangler:
--   wrangler d1 execute assessment_db --file=d1-schema.sql
--
-- Or deploy with migrations:
--   migrations/001_initial_schema.sql
--

-- =====================================================================
-- 1. COMPANIES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(active);


-- =====================================================================
-- 2. QUESTION_SETS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  version INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  metadata JSONB DEFAULT '{}',
  FOREIGN KEY(company_id) REFERENCES companies(id),
  UNIQUE(company_id, version)
);

CREATE INDEX IF NOT EXISTS idx_question_sets_company
  ON question_sets(company_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_company_version
  ON question_sets(company_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_question_sets_active
  ON question_sets(active);


-- =====================================================================
-- 3. QUESTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  question_set_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  order_index INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'likert',
  scale_min INT DEFAULT 1,
  scale_max INT DEFAULT 5,
  category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(question_set_id) REFERENCES question_sets(id),
  UNIQUE(question_set_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_question_set
  ON questions(question_set_id, order_index);
CREATE INDEX IF NOT EXISTS idx_questions_category
  ON questions(category);


-- =====================================================================
-- 4. RESPONSES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  question_set_id TEXT NOT NULL,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  respondent_department TEXT,
  respondent_role TEXT,

  -- Derived metrics (denormalized for fast querying)
  average_score REAL,
  min_score INT,
  max_score INT,
  maturity_level TEXT,
  ai_maturity_score INT,

  -- Status & timestamps
  status TEXT DEFAULT 'submitted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Extensibility
  metadata JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',

  FOREIGN KEY(company_id) REFERENCES companies(id),
  FOREIGN KEY(question_set_id) REFERENCES question_sets(id)
);

CREATE INDEX IF NOT EXISTS idx_responses_company
  ON responses(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_created_at
  ON responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_email
  ON responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_responses_department
  ON responses(respondent_department);
CREATE INDEX IF NOT EXISTS idx_responses_avg_score
  ON responses(company_id, average_score DESC);
CREATE INDEX IF NOT EXISTS idx_responses_maturity
  ON responses(company_id, maturity_level);
CREATE INDEX IF NOT EXISTS idx_responses_status
  ON responses(company_id, status);


-- =====================================================================
-- 5. ANSWERS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  score INT,
  text_answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(response_id) REFERENCES responses(id) ON DELETE CASCADE,
  FOREIGN KEY(question_id) REFERENCES questions(id)
);

CREATE INDEX IF NOT EXISTS idx_answers_response
  ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question
  ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_score
  ON answers(score);


-- =====================================================================
-- 6. WEBHOOKS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  company_id TEXT NOT NULL,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  retry_count INT DEFAULT 0,
  last_attempted_at DATETIME,
  last_status_code INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1,
  FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_company
  ON webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_company_event
  ON webhooks(company_id, event_type, active);


-- =====================================================================
-- 7. AUDIT_LOG TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT,
  changes JSONB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log(created_at DESC);


-- =====================================================================
-- SAMPLE DATA (optional, for testing)
-- =====================================================================

-- Insert a test company
INSERT INTO companies (id, slug, name, created_at, updated_at, active)
VALUES (
  '0123456789abcdef',
  'test-company',
  'Test Company',
  datetime('now'),
  datetime('now'),
  1
);

-- Insert a test question set (v1)
INSERT INTO question_sets (
  id, company_id, version, name, description, active,
  created_at, published_at, metadata
) VALUES (
  'qs0123456789abcd',
  '0123456789abcdef',
  1,
  'AI Maturity Assessment v1',
  'Initial assessment for AI capabilities',
  1,
  datetime('now'),
  datetime('now'),
  '{"scoring_method": "average", "min_score": 1, "max_score": 5}'
);

-- Insert test questions
INSERT INTO questions (
  id, question_set_id, external_id, order_index,
  question_text, question_type, scale_min, scale_max,
  category, metadata, created_at
) VALUES
  (
    'q0000000000000001',
    'qs0123456789abcd',
    'q1',
    0,
    'How familiar are you with AI tools like ChatGPT?',
    'likert',
    1,
    5,
    'ai-tools',
    '{}',
    datetime('now')
  ),
  (
    'q0000000000000002',
    'qs0123456789abcd',
    'q2',
    1,
    'How often do you use code generation tools?',
    'likert',
    1,
    5,
    'ai-tools',
    '{}',
    datetime('now')
  ),
  (
    'q0000000000000003',
    'qs0123456789abcd',
    'q3',
    2,
    'How confident are you in evaluating AI model outputs?',
    'likert',
    1,
    5,
    'skills',
    '{}',
    datetime('now')
  ),
  (
    'q0000000000000004',
    'qs0123456789abcd',
    'q4',
    3,
    'How much do you understand AI limitations and biases?',
    'likert',
    1,
    5,
    'knowledge',
    '{}',
    datetime('now')
  ),
  (
    'q0000000000000005',
    'qs0123456789abcd',
    'q5',
    4,
    'How would you rate your overall AI competency?',
    'likert',
    1,
    5,
    'self-assessment',
    '{}',
    datetime('now')
  );

-- =====================================================================
-- CLEANUP (if you need to reset everything)
-- =====================================================================
-- DROP TABLE IF EXISTS answers;
-- DROP TABLE IF EXISTS responses;
-- DROP TABLE IF EXISTS questions;
-- DROP TABLE IF EXISTS question_sets;
-- DROP TABLE IF EXISTS companies;
-- DROP TABLE IF EXISTS webhooks;
-- DROP TABLE IF EXISTS audit_log;
