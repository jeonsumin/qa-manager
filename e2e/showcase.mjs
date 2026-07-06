// 쇼케이스: 실제 SDK 플로우로 티켓을 만들고 대시보드 화면을 캡처한다.
import { chromium, request as pwRequest } from '@playwright/test';
import fs from 'node:fs';

const API = 'http://localhost:3000';
const OUT = '/tmp/qa-shots';
fs.mkdirSync(OUT, { recursive: true });

const api = await pwRequest.newContext();
const projRes = await api.post(`${API}/api/projects`, {
  data: { name: '브라이트벨 홈페이지', description: '리뉴얼 QA' },
});
const project = await projRes.json();
console.log('project:', project.id, project.projectKey);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript((key) => { window.__QA_PROJECT_KEY__ = key; }, project.projectKey);

// ── 데모 앱에서 리포트 2건 제출 (실제 SDK 경로) ──
await page.goto('http://localhost:5173/');
await page.getByTestId('trigger-console-error').click();
await page.getByTestId('trigger-network-error').click();
await page.waitForTimeout(500);

// 1건: BUG
await page.getByTestId('qa-fab').click();
await page.getByTestId('qa-form').waitFor({ timeout: 30000 });
await page.getByTestId('qa-type-select').selectOption('BUG');
await page.getByTestId('qa-title-input').fill('상품 목록 클릭 시 콘솔 에러 발생');
await page.getByTestId('qa-desc-input').fill('데모 콘텐츠 영역의 버튼을 누르면 콘솔에 에러가 찍히고 목록 API가 404를 반환합니다.');
await page.getByTestId('qa-submit').click();
await page.getByText('리포트가 전송되었습니다').waitFor({ timeout: 20000 });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// 2건: DESIGN (드래그 영역 + TO-BE)
await page.getByTestId('qa-fab').click();
await page.getByTestId('qa-form').waitFor({ timeout: 30000 });
await page.getByTestId('qa-type-select').selectOption('DESIGN');
await page.getByTestId('qa-title-input').fill('히어로 영역 여백 과다');
await page.getByTestId('qa-region-button').click();
await page.getByTestId('qa-region-overlay').waitFor();
await page.mouse.move(120, 160);
await page.mouse.down();
await page.mouse.move(620, 420, { steps: 8 });
await page.mouse.up();
await page.getByTestId('qa-form').waitFor();
await page.getByTestId('qa-tobe-input').fill('상하 여백을 절반으로 줄이고 제목을 왼쪽 정렬로 변경해 주세요.');
await page.getByTestId('qa-submit').click();
await page.getByText('리포트가 전송되었습니다').waitFor({ timeout: 20000 });

// 코멘트 하나 (개발자 시점)
const tickets = await (await api.get(`${API}/api/tickets?projectId=${project.id}`)).json();
const design = tickets.find((t) => t.type === 'DESIGN');
const bug = tickets.find((t) => t.type === 'BUG');
await api.post(`${API}/api/tickets/${bug.id}/comments`, {
  data: { author: '김개발', body: '재현 확인했습니다. 이번 주 내 수정 예정입니다.' },
});
await api.patch(`${API}/api/tickets/${bug.id}`, { data: { status: 'FIXING' } });

// ── 대시보드 화면 캡처 ──
async function shot(url, name, extra) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  if (extra) await extra();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('shot:', name);
}

await shot(`${API}/`, '1-projects');
await shot(`${API}/projects/${project.id}`, '2-tickets');
await shot(`${API}/tickets/${design.id}`, '3-ticket-design', async () => {
  await page.getByText('콘솔 에러 (').click();
  await page.waitForTimeout(400);
});
await shot(`${API}/projects/${project.id}/settings`, '4-settings');

await browser.close();
await api.dispose();
console.log('DONE');
