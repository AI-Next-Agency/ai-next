-- Migration: Initial Assessment Response Schema
-- Description: Minimalist 3-table design for assessment form responses
-- Date: 2026-04-26

-- ============================================================================
-- Table 1: companies
-- Static reference data. One row per client.
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  company_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  question_count INTEGER NOT NULL,
  metadata TEXT,  -- JSON: arbitrary extra config
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- ============================================================================
-- Table 2: questions
-- Static reference data. One row per question per company.
-- Immutable—changes require new question_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  company_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,  -- display order within company
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, question_id),
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_company ON questions(company_id);

-- ============================================================================
-- Table 3: responses
-- The entire form submission as one denormalized row.
-- Immutable—no updates, only inserts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS responses (
  response_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  ai_maturity_score REAL NOT NULL,  -- 0.0 to 5.0
  maturity_level TEXT NOT NULL,     -- foundation, emerging, scaling, leading
  questions_json TEXT NOT NULL,     -- [{"id":"q1","score":4}, ...]
  metadata_json TEXT,               -- {"userAgent":"...", "ip":"...", ...}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_responses_company_created ON responses(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_email ON responses(email);
CREATE INDEX IF NOT EXISTS idx_responses_company_maturity ON responses(company_id, maturity_level);
CREATE INDEX IF NOT EXISTS idx_responses_company_department ON responses(company_id, department);

-- ============================================================================
-- Sample Data (optional—remove for production)
-- ============================================================================

-- Sample company
INSERT OR IGNORE INTO companies (company_id, name, slug, question_count)
VALUES ('acme-corp', 'ACME Corporation', 'acme-corp', 3);

-- Sample questions for acme-corp
INSERT OR IGNORE INTO questions (company_id, question_id, title, description, order_index)
VALUES
  ('acme-corp', 'q1', 'Does your organization have a documented AI strategy?', 'E.g., published goals, budget, governance', 1),
  ('acme-corp', 'q2', 'Do you measure ROI on AI investments?', 'Track metrics like cost savings, efficiency gains', 2),
  ('acme-corp', 'q3', 'Does your leadership team have AI literacy?', 'Executive understanding of opportunities and risks', 3);
