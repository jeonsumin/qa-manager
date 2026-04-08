import db from '../db/database';

interface TestCaseRow {
  id: number;
  project_id: number;
  title: string;
  category: string | null;
  priority: string;
  precondition: string | null;
  steps: string | null;
  expected_result: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_result?: string | null;
}

function toTestCase(row: TestCaseRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    precondition: row.precondition,
    steps: row.steps,
    expectedResult: row.expected_result,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastResult: row.last_result || null,
  };
}

export const testCaseModel = {
  findAll(projectId: number, filters: { category?: string; priority?: string; keyword?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = ['tc.project_id = ?'];
    const params: unknown[] = [projectId];

    if (filters.category) { conditions.push('tc.category = ?'); params.push(filters.category); }
    if (filters.priority) { conditions.push('tc.priority = ?'); params.push(filters.priority); }
    if (filters.keyword) { conditions.push('tc.title LIKE ?'); params.push(`%${filters.keyword}%`); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM test_cases tc ${where}`).get(...params) as { cnt: number }).cnt;
    const rows = db.prepare(`
      SELECT tc.*,
        (SELECT trr.status FROM test_run_results trr
         JOIN test_runs tr ON trr.test_run_id = tr.id
         WHERE trr.test_case_id = tc.id AND tr.project_id = tc.project_id
         ORDER BY trr.updated_at DESC LIMIT 1) as last_result
      FROM test_cases tc ${where}
      ORDER BY tc.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as TestCaseRow[];

    return { data: rows.map(toTestCase), total };
  },

  findById(id: number) {
    const row = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(id) as TestCaseRow | undefined;
    if (!row) return null;
    const history = db.prepare(`
      SELECT trr.status, trr.updated_at, tr.name as run_name, tr.id as run_id
      FROM test_run_results trr
      JOIN test_runs tr ON trr.test_run_id = tr.id
      WHERE trr.test_case_id = ?
      ORDER BY trr.updated_at DESC
    `).all(id);
    return { ...toTestCase(row), executionHistory: history };
  },

  create(projectId: number, data: { title: string; category?: string; priority?: string; precondition?: string; steps?: string; expectedResult?: string; description?: string }) {
    const result = db.prepare(`
      INSERT INTO test_cases (project_id, title, category, priority, precondition, steps, expected_result, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, data.title, data.category || null, data.priority || 'medium', data.precondition || null, data.steps || null, data.expectedResult || null, data.description || null);
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: Partial<{ title: string; category: string; priority: string; precondition: string; steps: string; expectedResult: string; description: string }>) {
    const map: Record<string, string> = { title: 'title', category: 'category', priority: 'priority', precondition: 'precondition', steps: 'steps', expectedResult: 'expected_result', description: 'description' };
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const [key, col] of Object.entries(map)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        fields.push(`${col} = ?`);
        params.push((data as Record<string, unknown>)[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);
    db.prepare(`UPDATE test_cases SET ${fields.join(', ')} WHERE id = ?`).run(...params, id);
    return this.findById(id);
  },

  delete(id: number) {
    db.prepare('DELETE FROM test_cases WHERE id = ?').run(id);
  },

  getCategories(projectId: number): string[] {
    const rows = db.prepare('SELECT DISTINCT category FROM test_cases WHERE project_id = ? AND category IS NOT NULL ORDER BY category').all(projectId) as { category: string }[];
    return rows.map(r => r.category);
  },
};
