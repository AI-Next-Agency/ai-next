-- D1 Database Schema for Assessment Response Storage
-- Dashboard-First Architecture with Pre-Aggregated Metrics
-- Created: 2026-04-26

-- Companies table (reference data)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Questions for each company (supports versioning)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  title TEXT NOT NULL,
  label TEXT,
  context TEXT,
  options TEXT NOT NULL, -- JSON array: [{"value": 1, "label": "...", "context": "..."}, ...]
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, question_id, version)
);

-- Raw assessment responses (one row per submission)
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  respondent_name TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  ai_maturity_score REAL NOT NULL, -- 1.0 to 5.0
  maturity_level TEXT NOT NULL, -- "Initial", "Beginner", "Developing", "Intermediate", "Advanced"
  response_data TEXT NOT NULL, -- JSON: full submission payload
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Individual question answers (normalized for querying)
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_value INTEGER NOT NULL, -- 1-5
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (response_id) REFERENCES responses(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Pre-aggregated: Daily metrics per company
CREATE TABLE IF NOT EXISTS company_daily_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  submission_count INTEGER DEFAULT 0,
  avg_score REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, date)
);

-- Pre-aggregated: Maturity level distribution
CREATE TABLE IF NOT EXISTS company_maturity_distribution (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  maturity_level TEXT NOT NULL, -- "Initial", "Beginner", "Developing", "Intermediate", "Advanced"
  count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, maturity_level)
);

-- Pre-aggregated: Score distribution (histogram)
CREATE TABLE IF NOT EXISTS company_score_distribution (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  score_bucket TEXT NOT NULL, -- "1-1.5", "1.5-2", "2-2.5", "2.5-3", "3-3.5", "3.5-4", "4-4.5", "4.5-5"
  count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE(company_id, score_bucket)
);

-- Pre-aggregated: Per-question averages
CREATE TABLE IF NOT EXISTS company_question_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  avg_score REAL,
  response_count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  UNIQUE(company_id, question_id)
);

-- Submission timeline (for charts)
CREATE TABLE IF NOT EXISTS company_submission_timeline (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  hour INTEGER, -- 0-23, NULL = daily aggregate
  submission_count INTEGER DEFAULT 0,
  avg_score REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_responses_company_id ON responses(company_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_company_submitted ON responses(company_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_maturity_level ON responses(maturity_level);

CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_questions_company_id ON questions(company_id);
CREATE INDEX IF NOT EXISTS idx_questions_version ON questions(company_id, question_id, version);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_company_date ON company_daily_metrics(company_id, date);
CREATE INDEX IF NOT EXISTS idx_maturity_distribution_company ON company_maturity_distribution(company_id);
CREATE INDEX IF NOT EXISTS idx_score_distribution_company ON company_score_distribution(company_id);
CREATE INDEX IF NOT EXISTS idx_question_metrics_company ON company_question_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_submission_timeline_company ON company_submission_timeline(company_id, date);
