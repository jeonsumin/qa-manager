PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'on-hold')),
  start_date  TEXT,
  end_date    TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS test_cases (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  category        TEXT,
  priority        TEXT    NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  precondition    TEXT,
  steps           TEXT,
  expected_result TEXT,
  description     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_category   ON test_cases(category);
CREATE INDEX IF NOT EXISTS idx_test_cases_priority   ON test_cases(priority);

CREATE TABLE IF NOT EXISTS test_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  description TEXT,
  environment TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON test_runs(project_id);

CREATE TABLE IF NOT EXISTS test_run_results (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  test_run_id  INTEGER NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  status       TEXT    NOT NULL DEFAULT 'not-run'
                 CHECK (status IN ('not-run', 'pass', 'fail', 'blocked')),
  comment      TEXT,
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (test_run_id, test_case_id)
);

CREATE INDEX IF NOT EXISTS idx_test_run_results_run_id  ON test_run_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_run_results_case_id ON test_run_results(test_case_id);

CREATE TABLE IF NOT EXISTS issues (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT    NOT NULL,
  severity            TEXT    NOT NULL DEFAULT 'minor'
                        CHECK (severity IN ('critical', 'major', 'minor', 'trivial')),
  status              TEXT    NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'in-progress', 'resolved', 'closed', 'rejected')),
  description         TEXT,
  steps_to_reproduce  TEXT,
  expected_result     TEXT,
  actual_result       TEXT,
  assignee            TEXT,
  test_case_id        INTEGER REFERENCES test_cases(id) ON DELETE SET NULL,
  test_run_result_id  INTEGER REFERENCES test_run_results(id) ON DELETE SET NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status     ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity   ON issues(severity);

CREATE TRIGGER IF NOT EXISTS trg_projects_updated_at
  AFTER UPDATE ON projects FOR EACH ROW
BEGIN
  UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_test_cases_updated_at
  AFTER UPDATE ON test_cases FOR EACH ROW
BEGIN
  UPDATE test_cases SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_test_runs_updated_at
  AFTER UPDATE ON test_runs FOR EACH ROW
BEGIN
  UPDATE test_runs SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_test_run_results_updated_at
  AFTER UPDATE ON test_run_results FOR EACH ROW
BEGIN
  UPDATE test_run_results SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_issues_updated_at
  AFTER UPDATE ON issues FOR EACH ROW
BEGIN
  UPDATE issues SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS bug_reports (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  session_id        TEXT,
  title             TEXT,
  description       TEXT,
  last_error        TEXT,        -- JSON: { message, stack, type }
  breadcrumbs       TEXT,        -- JSON array
  recent_networks   TEXT,        -- JSON array
  env               TEXT,        -- JSON: { userAgent, url, viewport }
  screenshot        TEXT,        -- base64 data URL
  status            TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new', 'reviewed', 'converted')),
  issue_id          INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_project_id ON bug_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status     ON bug_reports(status);

CREATE TRIGGER IF NOT EXISTS trg_bug_reports_updated_at
  AFTER UPDATE ON bug_reports FOR EACH ROW
BEGIN
  UPDATE bug_reports SET created_at = created_at WHERE id = OLD.id;
END;
