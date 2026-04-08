import db from '../db/database';

interface IssueRow {
  id: number;
  project_id: number;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  steps_to_reproduce: string | null;
  expected_result: string | null;
  actual_result: string | null;
  assignee: string | null;
  test_case_id: number | null;
  test_run_result_id: number | null;
  created_at: string;
  updated_at: string;
}

function toIssue(row: IssueRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    description: row.description,
    stepsToReproduce: row.steps_to_reproduce,
    expectedResult: row.expected_result,
    actualResult: row.actual_result,
    assignee: row.assignee,
    testCaseId: row.test_case_id,
    testRunResultId: row.test_run_result_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const issueModel = {
  findAll(projectId: number, filters: { status?: string; severity?: string; keyword?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = ['project_id = ?'];
    const params: unknown[] = [projectId];
    if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }
    if (filters.severity) { conditions.push('severity = ?'); params.push(filters.severity); }
    if (filters.keyword) { conditions.push('title LIKE ?'); params.push(`%${filters.keyword}%`); }
    const where = 'WHERE ' + conditions.join(' AND ');

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM issues ${where}`).get(...params) as { cnt: number }).cnt;
    const rows = db.prepare(`SELECT * FROM issues ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as IssueRow[];

    return { data: rows.map(toIssue), total };
  },

  findById(id: number) {
    const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(id) as IssueRow | undefined;
    if (!row) return null;
    const issue = toIssue(row);
    let testCase = null;
    if (row.test_case_id) {
      testCase = db.prepare('SELECT id, title, category, priority FROM test_cases WHERE id = ?').get(row.test_case_id);
    }
    return { ...issue, testCase };
  },

  create(projectId: number, data: {
    title: string; severity?: string; status?: string; description?: string;
    stepsToReproduce?: string; expectedResult?: string; actualResult?: string;
    assignee?: string; testCaseId?: number; testRunResultId?: number;
  }) {
    const result = db.prepare(`
      INSERT INTO issues (project_id, title, severity, status, description, steps_to_reproduce, expected_result, actual_result, assignee, test_case_id, test_run_result_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId, data.title, data.severity || 'minor', data.status || 'open',
      data.description || null, data.stepsToReproduce || null, data.expectedResult || null,
      data.actualResult || null, data.assignee || null, data.testCaseId || null, data.testRunResultId || null
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: Partial<{
    title: string; severity: string; status: string; description: string;
    stepsToReproduce: string; expectedResult: string; actualResult: string;
    assignee: string; testCaseId: number; testRunResultId: number;
  }>) {
    const map: Record<string, string> = {
      title: 'title', severity: 'severity', status: 'status', description: 'description',
      stepsToReproduce: 'steps_to_reproduce', expectedResult: 'expected_result',
      actualResult: 'actual_result', assignee: 'assignee',
      testCaseId: 'test_case_id', testRunResultId: 'test_run_result_id',
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
    db.prepare(`UPDATE issues SET ${fields.join(', ')} WHERE id = ?`).run(...params, id);
    return this.findById(id);
  },

  delete(id: number) {
    db.prepare('DELETE FROM issues WHERE id = ?').run(id);
  },
};
