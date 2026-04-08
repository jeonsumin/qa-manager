import request from 'supertest';
import { app } from '../src/app';
import db from '../src/db/database';

let projectId: number;

beforeAll(() => {
  const res = db.prepare("INSERT INTO projects (name, status) VALUES ('TC Test Project', 'active')").run();
  projectId = res.lastInsertRowid as number;
});

afterAll(() => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
});

describe('Test Cases API', () => {
  let caseId: number;

  test('POST — 테스트 케이스 생성', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/test-cases`)
      .send({ title: '로그인 정상 케이스', category: '로그인', priority: 'critical', steps: '1. 접속\n2. 로그인', expectedResult: '메인 페이지 이동' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('로그인 정상 케이스');
    caseId = res.body.data.id;
  });

  test('GET — 목록 조회', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/test-cases`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET — 카테고리 필터', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/test-cases?category=로그인`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].category).toBe('로그인');
  });

  test('GET — 카테고리 목록', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/test-cases/categories`);
    expect(res.status).toBe(200);
    expect(res.body.data).toContain('로그인');
  });

  test('PUT — 수정', async () => {
    const res = await request(app).put(`/api/projects/${projectId}/test-cases/${caseId}`).send({ priority: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('high');
  });

  test('DELETE — 삭제', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}/test-cases/${caseId}`);
    expect(res.status).toBe(204);
  });
});
