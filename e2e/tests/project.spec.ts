import { test, expect } from '@playwright/test';

test.describe('프로젝트 관리', () => {
  test.afterAll(async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/projects');
    const json = await res.json();
    for (const p of json.data) {
      if (p.name === 'E2E 테스트 프로젝트') {
        await request.delete(`http://localhost:3001/api/projects/${p.id}`);
      }
    }
  });

  test('프로젝트 생성, 확인, 삭제', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: '+ 새 프로젝트' }).click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    await page.getByLabel('프로젝트명 *').fill('E2E 테스트 프로젝트');
    await page.getByLabel('설명').fill('Playwright E2E 테스트용 프로젝트');
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByRole('heading', { name: 'E2E 테스트 프로젝트' }).first()).toBeVisible();
  });

  test('대시보드에서 프로젝트 현황 확인', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
    await expect(page.getByText('전체 프로젝트')).toBeVisible();
  });
});
