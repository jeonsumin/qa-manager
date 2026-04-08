import request from 'supertest';
import { app } from '../src/app';
import db from '../src/db/database';

describe('Projects API', () => {
  let createdId: number;

  afterAll(() => {
    if (createdId) {
      db.prepare('DELETE FROM projects WHERE id = ?').run(createdId);
    }
  });

  test('POST /api/projects — 프로젝트 생성', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project 1', description: '테스트용', status: 'active' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Project 1');
    createdId = res.body.data.id;
  });

  test('GET /api/projects — 목록 조회', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/projects/:id — 단건 조회', async () => {
    const res = await request(app).get(`/api/projects/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
    expect(res.body.data.stats).toBeDefined();
  });

  test('GET /api/projects/999 — 없는 프로젝트 404', async () => {
    const res = await request(app).get('/api/projects/999999');
    expect(res.status).toBe(404);
  });

  test('PUT /api/projects/:id — 수정', async () => {
    const res = await request(app)
      .put(`/api/projects/${createdId}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
  });

  test('DELETE /api/projects/:id — 삭제', async () => {
    const res = await request(app).delete(`/api/projects/${createdId}`);
    expect(res.status).toBe(204);
    createdId = 0; // mark as deleted so afterAll skips
  });

  test('POST /api/projects — 이름 없으면 400', async () => {
    const res = await request(app).post('/api/projects').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
