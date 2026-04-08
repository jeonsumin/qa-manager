import db from '../db/database';

interface TestRunRow {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
    environment: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

interface ResultRow {
    id: number;
    test_run_id: number;
    test_case_id: number;
    status: string;
    comment: string | null;
    updated_at: string;
}

function getRunStats(runId: number) {
    const row = db.prepare(`
        SELECT COUNT(*)                                            as total,
               SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END)    as pass,
               SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END)    as fail,
               SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
               SUM(CASE WHEN status = 'not-run' THEN 1 ELSE 0 END) as not_run
        FROM test_run_results
        WHERE test_run_id = ?
    `).get(runId) as Record<string, number>;
    return {
        total: row.total || 0,
        pass: row.pass || 0,
        fail: row.fail || 0,
        blocked: row.blocked || 0,
        notRun: row.not_run || 0
    };
}

function toRun(row: TestRunRow) {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        description: row.description,
        environment: row.environment,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export const testRunModel = {
    findAll(projectId: number, filters: { status?: string; page?: number; limit?: number }) {
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

        const total = (db.prepare(`SELECT COUNT(*) as cnt
                                   FROM test_runs ${where}`).get(...params) as { cnt: number }).cnt;
        const rows = db.prepare(`SELECT *
                                 FROM test_runs ${where}
                                 ORDER BY created_at DESC LIMIT ?
                                 OFFSET ?`).all(...params, limit, offset) as TestRunRow[];

        return {data: rows.map(r => ({...toRun(r), stats: getRunStats(r.id)})), total};
    },

    findById(id: number) {
        const row = db.prepare('SELECT * FROM test_runs WHERE id = ?').get(id) as TestRunRow | undefined;
        if (!row) return null;

        const results = db.prepare(`
            SELECT trr.*, tc.title, tc.category, tc.priority, tc.steps, tc.expected_result, tc.precondition
            FROM test_run_results trr
                     JOIN test_cases tc ON trr.test_case_id = tc.id
            WHERE trr.test_run_id = ?
            ORDER BY tc.category, tc.id
        `).all(id) as (ResultRow & {
            title: string;
            category: string;
            priority: string;
            steps: string;
            expected_result: string;
            precondition: string
        })[];

        const formattedResults = results.map(r => ({
            id: r.id,
            testCaseId: r.test_case_id,
            status: r.status,
            comment: r.comment,
            updatedAt: r.updated_at,
            testCase: {
                id: r.test_case_id,
                title: r.title,
                category: r.category,
                priority: r.priority,
                steps: r.steps,
                expectedResult: r.expected_result,
                precondition: r.precondition,
            },
        }));

        return {...toRun(row), stats: getRunStats(id), results: formattedResults};
    },

    create(projectId: number, data: {
        name: string;
        description?: string;
        environment?: string;
        testCaseIds: number[]
    }) {
        const run = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO test_runs (project_id, name, description, environment)
                VALUES (?, ?, ?, ?)
            `).run(projectId, data.name, data.description || null, data.environment || null);
            const runId = result.lastInsertRowid as number;
            const insertResult = db.prepare('INSERT INTO test_run_results (test_run_id, test_case_id) VALUES (?, ?)');
            for (const caseId of data.testCaseIds) {
                insertResult.run(runId, caseId);
            }
            return runId;
        })();
        return this.findById(run)!;
    },

    update(id: number, data: { name?: string; description?: string; environment?: string; status?: string }) {
        const fields: string[] = [];
        const params: unknown[] = [];
        if (data.name !== undefined) {
            fields.push('name = ?');
            params.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            params.push(data.description);
        }
        if (data.environment !== undefined) {
            fields.push('environment = ?');
            params.push(data.environment);
        }
        if (data.status !== undefined) {
            fields.push('status = ?');
            params.push(data.status);
        }
        if (fields.length === 0) return this.findById(id);
        db.prepare(`UPDATE test_runs
                    SET ${fields.join(', ')}
                    WHERE id = ?`).run(...params, id);
        return this.findById(id);
    },

    delete(id: number) {
        db.prepare('DELETE FROM test_runs WHERE id = ?').run(id);
    },

    updateResult(resultId: number, data: { status: string; comment?: string }) {
        db.prepare('UPDATE test_run_results SET status = ?, comment = ? WHERE id = ?').run(data.status, data.comment || null, resultId);
        const row = db.prepare('SELECT * FROM test_run_results WHERE id = ?').get(resultId) as ResultRow | undefined;
        if (!row) return null;
        return {
            id: row.id,
            testRunId: row.test_run_id,
            testCaseId: row.test_case_id,
            status: row.status,
            comment: row.comment,
            updatedAt: row.updated_at,
        };
    },

    findResultById(resultId: number) {
        return db.prepare('SELECT * FROM test_run_results WHERE id = ?').get(resultId) as ResultRow | undefined;
    },
};
