import { test, expect } from '@playwright/test';
import { API_BASE, createProject, getTickets, getTicketDetail } from './helpers.js';

// 시나리오 2: SDK 로그/캡처 전달
test('demo에서 BUG 리포트 제출 → 로그/스크린샷 전달 확인', async ({ page, request }) => {
  const project = await createProject(request, `sdk-report ${Date.now()}`);

  // projectKey를 window에 주입 (App.jsx가 window.__QA_PROJECT_KEY__ 우선 사용)
  await page.addInitScript((key) => {
    window.__QA_PROJECT_KEY__ = key;
  }, project.projectKey);

  await page.goto('/');
  await expect(page.getByTestId('qa-fab')).toBeVisible();

  // 에러 트리거 2개 클릭 (폼 마운트 전에 로그가 쌓여 있어야 함)
  await page.getByTestId('trigger-console-error').click();
  await page.getByTestId('trigger-network-error').click();
  // 네트워크 요청(404)이 수집기에 기록될 시간을 준다
  await page.waitForTimeout(1000);

  // 플로팅 버튼 클릭 → html2canvas 캡처 후 폼 오픈 (넉넉히 대기)
  await page.getByTestId('qa-fab').click();
  await expect(page.getByTestId('qa-form')).toBeVisible({ timeout: 30_000 });

  // 폼 작성: 유형 BUG, 제목 입력
  await page.getByTestId('qa-type-select').selectOption('BUG');
  await page.getByTestId('qa-title-input').fill('SDK 전달 테스트');

  await page.getByTestId('qa-submit').click();

  // 성공 문구 대기
  await expect(page.getByText('리포트가 전송되었습니다. 감사합니다!')).toBeVisible({
    timeout: 20_000,
  });

  // API로 해당 프로젝트 티켓 조회
  const tickets = await getTickets(request, project.id);
  expect(tickets.length).toBeGreaterThanOrEqual(1);
  const ticket = tickets.find((t) => t.title === 'SDK 전달 테스트');
  expect(ticket).toBeTruthy();

  const detail = await getTicketDetail(request, ticket.id);

  // logs: consoleErrors ≥ 1, networkErrors ≥ 1
  expect(detail.logs).toBeTruthy();
  expect(Array.isArray(detail.logs.consoleErrors)).toBe(true);
  expect(detail.logs.consoleErrors.length).toBeGreaterThanOrEqual(1);
  expect(Array.isArray(detail.logs.networkErrors)).toBe(true);
  expect(detail.logs.networkErrors.length).toBeGreaterThanOrEqual(1);

  // pageUrl에 localhost:5173 포함
  expect(detail.pageUrl).toContain('localhost:5173');

  // attachments에 kind=SCREENSHOT 존재
  const screenshot = detail.attachments.find((a) => a.kind === 'SCREENSHOT');
  expect(screenshot).toBeTruthy();

  // GET /api/attachments/:id → 200 + content-type image/png
  const attRes = await request.get(`${API_BASE}/api/attachments/${screenshot.id}`);
  expect(attRes.status()).toBe(200);
  expect(attRes.headers()['content-type']).toContain('image/png');
});
