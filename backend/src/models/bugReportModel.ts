import db from '../db/database';

interface BugReportRow {
  id: number;
  project_id: number | null;
  session_id: string | null;
  title: string | null;
  description: string | null;
  last_error: string | null;
  breadcrumbs: string | null;
  recent_networks: string | null;
  env: string | null;
  screenshot: string | null;
  status: string;
  issue_id: number | null;
  created_at: string;
}

function parseJsonField(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toBugReport(row: BugReportRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    sessionId: row.session_id,
    title: row.title,
    description: row.description,
    lastError: parseJsonField(row.last_error),
    breadcrumbs: parseJsonField(row.breadcrumbs),
    recentNetworks: parseJsonField(row.recent_networks),
    env: parseJsonField(row.env),
    screenshot: row.screenshot,
    status: row.status,
    issueId: row.issue_id,
    createdAt: row.created_at,
  };
}

export const bugReportModel = {
  findAll(
    projectId: number,
    filters: { status?: string; page?: number; limit?: number }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = ['project_id = ?'];
    const params: unknown[] = [projectId];
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    const where = 'WHERE ' + conditions.join(' AND ');

    const total = (
      db.prepare(`SELECT COUNT(*) as cnt FROM bug_reports ${where}`).get(...params) as { cnt: number }
    ).cnt;
    const rows = db
      .prepare(`SELECT * FROM bug_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as BugReportRow[];

    return { data: rows.map(toBugReport), total };
  },

  findById(id: number) {
    const row = db.prepare('SELECT * FROM bug_reports WHERE id = ?').get(id) as BugReportRow | undefined;
    if (!row) return null;
    return toBugReport(row);
  },

  create(
    projectId: number,
    data: {
      sessionId?: string;
      title?: string;
      description?: string;
      lastError?: unknown;
      breadcrumbs?: unknown;
      recentNetworks?: unknown;
      env?: unknown;
      screenshot?: string;
    }
  ) {
    const result = db
      .prepare(`
        INSERT INTO bug_reports
          (project_id, session_id, title, description, last_error, breadcrumbs, recent_networks, env, screenshot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        projectId,
        data.sessionId ?? null,
        data.title ?? null,
        data.description ?? null,
        data.lastError != null ? JSON.stringify(data.lastError) : null,
        data.breadcrumbs != null ? JSON.stringify(data.breadcrumbs) : null,
        data.recentNetworks != null ? JSON.stringify(data.recentNetworks) : null,
        data.env != null ? JSON.stringify(data.env) : null,
        data.screenshot ?? null
      );
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(
    id: number,
    data: { status?: string; issueId?: number | null; description?: string }
  ) {
    const map: Record<string, string> = {
      status: 'status',
      issueId: 'issue_id',
      description: 'description',
    };
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const [key, col] of Object.entries(map)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push((data as Record<string, unknown>)[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);
    db.prepare(`UPDATE bug_reports SET ${fields.join(', ')} WHERE id = ?`).run(...params, id);
    return this.findById(id);
  },

  delete(id: number) {
    db.prepare('DELETE FROM bug_reports WHERE id = ?').run(id);
  },
};
