import { test, expect } from '@playwright/test';
import { createProject, getTickets, getTicketDetail } from './helpers.js';

// 시나리오 3: 디자인 QA 좌표
test('디자인 리포트: 영역 드래그 좌표가 정확히 저장된다', async ({ page, request }) => {
  const project = await createProject(request, `design-region ${Date.now()}`);

  await page.addInitScript((key) => {
    window.__QA_PROJECT_KEY__ = key;
  }, project.projectKey);

  await page.goto('/');
  await expect(page.getByTestId('qa-fab')).toBeVisible();

  // 플로팅 버튼 → 폼 오픈
  await page.getByTestId('qa-fab').click();
  await expect(page.getByTestId('qa-form')).toBeVisible({ timeout: 30_000 });

  // 유형 = DESIGN
  await page.getByTestId('qa-type-select').selectOption('DESIGN');

  // 영역 선택 버튼 → 오버레이 등장
  await page.getByTestId('qa-region-button').click();
  await expect(page.getByTestId('qa-region-overlay')).toBeVisible();

  // (100,100) → (300,250) 드래그
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(300, 250, { steps: 5 });
  await page.mouse.up();

  // 오버레이가 닫히고 폼으로 복귀
  await expect(page.getByTestId('qa-form')).toBeVisible();

  // TO-BE 텍스트 + 제목 입력
  const toBeText = '버튼을 더 크게 만들어 주세요';
  await page.getByTestId('qa-tobe-input').fill(toBeText);
  await page.getByTestId('qa-title-input').fill('디자인 좌표 테스트');

  await page.getByTestId('qa-submit').click();

  await expect(page.getByText('리포트가 전송되었습니다. 감사합니다!')).toBeVisible({
    timeout: 20_000,
  });

  // API 조회
  const tickets = await getTickets(request, project.id);
  const ticket = tickets.find((t) => t.title === '디자인 좌표 테스트');
  expect(ticket).toBeTruthy();

  const detail = await getTicketDetail(request, ticket.id);
  expect(detail.type).toBe('DESIGN');
  expect(detail.region).toBeTruthy();

  const r = detail.region;
  expect(r.x).toBeGreaterThanOrEqual(98);
  expect(r.x).toBeLessThanOrEqual(102);
  expect(r.y).toBeGreaterThanOrEqual(98);
  expect(r.y).toBeLessThanOrEqual(102);
  expect(r.width).toBeGreaterThanOrEqual(198);
  expect(r.width).toBeLessThanOrEqual(202);
  expect(r.height).toBeGreaterThanOrEqual(148);
  expect(r.height).toBeLessThanOrEqual(152);
  expect(r.viewportWidth).toBe(1280);
  expect(r.viewportHeight).toBe(800);

  expect(detail.toBe).toBe(toBeText);
});
