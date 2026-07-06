import { test, expect } from '@playwright/test';
import { API_BASE, createProject, getTickets } from './helpers.js';

// 시나리오 1: 프로젝트 발급 ~ 연동 흐름 (순수 API)
test('프로젝트 생성 → ingest POST → tickets에 노출 → 잘못된 키 401', async ({ request }) => {
  // 1) 프로젝트 생성 → projectKey 획득
  const project = await createProject(request, `api-flow ${Date.now()}`);
  expect(project.id).toBeTruthy();
  expect(project.projectKey).toMatch(/^qa_[0-9a-f]{32}$/);

  // 2) 그 키로 ingest POST → 201
  const ingestRes = await request.post(`${API_BASE}/api/ingest/tickets`, {
    data: {
      projectKey: project.projectKey,
      type: 'BUG',
      title: 'API 흐름 테스트 티켓',
      description: '설명',
      pageUrl: 'http://localhost:5173/',
      logs: { consoleErrors: [], networkErrors: [] },
    },
  });
  expect(ingestRes.status()).toBe(201);
  const ingestBody = await ingestRes.json();
  expect(ingestBody.id).toBeTruthy();

  // 3) GET /api/tickets?projectId= 에 나타남
  const tickets = await getTickets(request, project.id);
  const found = tickets.find((t) => t.id === ingestBody.id);
  expect(found).toBeTruthy();
  expect(found.title).toBe('API 흐름 테스트 티켓');
  expect(found.type).toBe('BUG');

  // 4) 잘못된 키는 401
  const badRes = await request.post(`${API_BASE}/api/ingest/tickets`, {
    data: {
      projectKey: 'qa_invalid_key_does_not_exist',
      type: 'BUG',
      title: '잘못된 키',
      pageUrl: 'http://localhost:5173/',
    },
  });
  expect(badRes.status()).toBe(401);
  const badBody = await badRes.json();
  expect(badBody.error).toBe('invalid projectKey');
});
