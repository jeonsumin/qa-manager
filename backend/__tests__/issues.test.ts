import request from 'supertest';
import { app } from '../src/app';
import db from '../src/db/database';

let projectId: number;

beforeAll(() => {
  const p = db.prepare("INSERT INTO projects (name, status) VALUES ('Issue Test Project', 'active')").run();
  projectId = p.lastInsertRowid as number;
});

afterAll(() => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
});

describe('Issues API', () => {
  let issueId: number;

  test('POST — 이슈 생성', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/issues`)
      .send({ title: '[결제] 결제 실패 오류', severity: 'critical', status: 'open', stepsToReproduce: '1. 결제 클릭', actualResult: '500 에러' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('[결제] 결제 실패 오류');
    expect(res.body.data.severity).toBe('critical');
    issueId = res.body.data.id;
  });

  test('GET — 목록 조회', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/issues`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET — 상태 필터', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/issues?status=open`);
    expect(res.status).toBe(200);
    res.body.data.forEach((i: { status: string }) => expect(i.status).toBe('open'));
  });

  test('PUT — 상태 변경 (in-progress)', async () => {
    const res = await request(app).put(`/api/projects/${projectId}/issues/${issueId}`).send({ status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in-progress');
  });

  test('GET — 단건 조회', async () => {
    const res = await request(app).get(`/api/projects/${projectId}/issues/${issueId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(issueId);
  });

  test('DELETE — 삭제', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}/issues/${issueId}`);
    expect(res.status).toBe(204);
  });
});
