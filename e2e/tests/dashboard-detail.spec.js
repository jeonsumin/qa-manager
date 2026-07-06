import { test, expect } from '@playwright/test';
import { createProject, API_BASE } from './helpers.js';

// 대시보드 티켓 상세 화면 렌더 검증 (로그 뷰어 / 스크린샷 / region 오버레이 / 좌표 텍스트)
const PNG_1x1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function ingest(request, projectKey, extra) {
  const res = await request.post(`${API_BASE}/api/ingest/tickets`, {
    data: {
      projectKey,
      type: 'DESIGN',
      title: '상세 화면 렌더 테스트',
      pageUrl: 'http://localhost:5173/detail-test',
      logs: {
        consoleErrors: [{ ts: '2026-07-06T00:00:00Z', message: '상세화면용 콘솔 에러' }],
        networkErrors: [],
      },
      region: { x: 10, y: 20, width: 30, height: 40, viewportWidth: 1280, viewportHeight: 800 },
      toBe: '여백을 줄여 주세요',
      ...extra,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).id;
}

test('티켓 상세: 로그 뷰어·스크린샷·region 오버레이가 렌더된다', async ({ page, request }) => {
  const project = await createProject(request, `detail-render ${Date.now()}`);
  const ticketId = await ingest(request, project.projectKey, { screenshot: PNG_1x1 });

  await page.goto(`${API_BASE}/tickets/${ticketId}`);
  await expect(page.getByText('상세 화면 렌더 테스트')).toBeVisible();
  await expect(page.getByTestId('status-select')).toBeVisible();

  // 로그 뷰어 (접이식 — 펼쳐서 내용 확인)
  await page.getByText('콘솔 에러 (1)').click();
  await expect(page.getByText('상세화면용 콘솔 에러')).toBeVisible();

  // 스크린샷 이미지가 실제 attachment를 로드
  const img = page.locator('img[src*="/api/attachments/"]');
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((el) => el.naturalWidth), { timeout: 10_000 })
    .toBeGreaterThan(0);

  // DESIGN 티켓 region 오버레이
  await expect(page.getByTestId('region-overlay')).toBeVisible();

  // TO-BE 텍스트
  await expect(page.getByText('여백을 줄여 주세요')).toBeVisible();
});

test('티켓 상세: 스크린샷 없는 DESIGN 티켓도 지정 영역 좌표가 표시된다', async ({ page, request }) => {
  const project = await createProject(request, `detail-noshot ${Date.now()}`);
  const ticketId = await ingest(request, project.projectKey, {});

  await page.goto(`${API_BASE}/tickets/${ticketId}`);
  await expect(page.getByText('지정 영역')).toBeVisible();
  await expect(page.getByText('x=10, y=20, 너비=30, 높이=40', { exact: false })).toBeVisible();
});
