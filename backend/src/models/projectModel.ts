import db from '../db/database';

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  totalCases: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  notRunCount: number;
  openIssueCount: number;
}

function toProject(row: ProjectRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getStats(projectId: number): ProjectStats {
  const caseStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN r.status = 'pass' THEN 1 ELSE 0 END) as pass_count,
      SUM(CASE WHEN r.status = 'fail' THEN 1 ELSE 0 END) as fail_count,
      SUM(CASE WHEN r.status = 'blocked' THEN 1 ELSE 0 END) as blocked_count,
      SUM(CASE WHEN r.status = 'not-run' OR r.status IS NULL THEN 1 ELSE 0 END) as not_run_count
    FROM test_cases tc
    LEFT JOIN (
      SELECT trr.test_case_id, trr.status
      FROM test_run_results trr
      JOIN test_runs tr ON trr.test_run_id = tr.id
      WHERE tr.project_id = ?
      ORDER BY trr.updated_at DESC
    ) r ON r.test_case_id = tc.id
    WHERE tc.project_id = ?
  `).get(projectId, projectId) as Record<string, number>;

  const issueCount = db.prepare(
    `SELECT COUNT(*) as cnt FROM issues WHERE project_id = ? AND status = 'open'`
  ).get(projectId) as { cnt: number };

  return {
    totalCases: caseStats.total || 0,
    passCount: caseStats.pass_count || 0,
    failCount: caseStats.fail_count || 0,
    blockedCount: caseStats.blocked_count || 0,
    notRunCount: caseStats.not_run_count || 0,
    openIssueCount: issueCount.cnt || 0,
  };
}

class ProjectModel {
  private static instance: ProjectModel;

  private constructor() {}

  static getInstance(): ProjectModel {
    if (!ProjectModel.instance) {
      ProjectModel.instance = new ProjectModel();
    }
    return ProjectModel.instance;
  }

  findAll(filters: { status?: string; page?: number; limit?: number }) {
    // Auto-complete projects whose end_date has passed
    db.prepare(
      `UPDATE projects SET status = 'completed' WHERE status = 'active' AND end_date IS NOT NULL AND end_date < date('now')`
    ).run();

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const params: unknown[] = [];
    let where = '';
    if (filters.status) {
      where = 'WHERE status = ?';
      params.push(filters.status);
    }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM projects ${where}`).get(...params) as { cnt: number }).cnt;
    const rows = db.prepare(
      `SELECT * FROM projects ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as ProjectRow[];

    const data = rows.map(r => ({ ...toProject(r), stats: getStats(r.id) }));
    return { data, total };
  }

  findById(id: number) {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
    if (!row) return null;
    return { ...toProject(row), stats: getStats(row.id) };
  }

  create(data: { name: string; description?: string; status?: string; startDate?: string; endDate?: string }) {
    const result = db.prepare(
      `INSERT INTO projects (name, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?)`
    ).run(data.name, data.description || null, data.status || 'active', data.startDate || null, data.endDate || null);
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: { name?: string; description?: string; status?: string; startDate?: string; endDate?: string }) {
    const map: Record<string, string> = {
      name: 'name', description: 'description', status: 'status',
      startDate: 'start_date', endDate: 'end_date',
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
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...params, id);
    return this.findById(id);
  }

  delete(id: number) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

export const projectModel = ProjectModel.getInstance();
