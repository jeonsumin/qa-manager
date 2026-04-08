import request from 'supertest';
import { app } from '../src/app';
import db from '../src/db/database';

let projectId: number;
let caseId: number;

beforeAll(() => {
  const p = db.prepare("INSERT INTO projects (name, status) VALUES ('TR Test Project', 'active')").run();
  projectId = p.lastInsertRowid as number;
  const tc = db.prepare("INSERT INTO test_cases (project_id, title, priority) VALUES (?, '샘플 케이스', 'medium')").run(projectId);
  caseId = tc.lastInsertRowid as number;
});

afterAll(() => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
});

describe('Test Runs API', () => {
  let runId: number;
  let resultId: number;

  test('POST — 테스트런 생성', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/test-runs`)
      .send({ name: '1차 테스트런', environment: 'Chrome', testCaseIds: [caseId] });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('1차 테스트런');
    runId = res.body.data.id;
  });

  test('GET — 테스트런 상세 (결과 포함)', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/test-runs/${runId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].status).toBe('not-run');
    resultId = res.body.data.results[0].id;
  });

  test('PUT — 결과 Pass 입력', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/test-runs/${runId}/results/${resultId}`)
      .send({ status: 'pass', comment: '정상 동작' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pass');
  });

  test('PUT — 테스트런 완료 처리', async () => {
    const res = await request(app).put(`/api/projects/${projectId}/test-runs/${runId}`).send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('POST — testCaseIds 없으면 400', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/test-runs`).send({ name: '빈 런' });
    expect(res.status).toBe(400);
  });

  test('DELETE — 테스트런 삭제', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}/test-runs/${runId}`);
    expect(res.status).toBe(204);
  });
});
