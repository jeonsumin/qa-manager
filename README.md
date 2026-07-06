# QA 리포트 대시보드

엑셀 기반 QA 관리를 대체하는 티켓 시스템. 구성: 대시보드(웹앱+API), React 연동 SDK, 검증용 데모 앱.

## 실행

```bash
# 대시보드 (API 서버 겸용, :3000)
cd dashboard && npm install && npx prisma db push && npm run dev

# 데모 호스트 앱 (:5173) — SDK 동작 확인용
cd demo && npm install && npm run dev
```

대시보드에서 프로젝트를 만들면 연동 키(`qa_...`)가 발급된다. 데모 앱은
`window.__QA_PROJECT_KEY__` 또는 `VITE_QA_PROJECT_KEY` 환경변수로 키를 받는다.

## 실제 프로젝트에 연동

**방법 A — Provider 패키지 (`sdk/`)**: 프로젝트에 `sdk/` 폴더를 복사하거나 `file:` 의존성으로 추가 후:

```jsx
import { QAReportProvider } from 'qa-report-sdk';

<QAReportProvider projectId="qa_발급받은키" apiBaseUrl="http://대시보드주소:3000">
  <App />
</QAReportProvider>
```

**방법 B — 단일 파일 (`sdk-single/QAReportWidget.jsx`)**: 파일 하나를 프로젝트에 복사 후:

```jsx
import QAReportWidget from './QAReportWidget.jsx';

<QAReportWidget projectId="qa_발급받은키" apiBaseUrl="http://대시보드주소:3000" />
```

방법 A는 html2canvas를 의존성으로 설치하고, 방법 B는 CDN에서 동적 로드한다(로드 실패 시 스크린샷 없이 동작).

## 테스트

```bash
cd e2e && npm install && npx playwright install chromium && npx playwright test
```

Playwright가 대시보드와 데모 서버를 자동 기동한다(포트 3000/5173이 비어 있어야 함).
시나리오: 키 발급~연동 흐름, SDK 로그/스크린샷 서버 전달, 디자인 QA 드래그 좌표 저장, 티켓 상세 화면 렌더.

## 계약 명세

데이터 모델·API·SDK 동작의 고정 계약은 `SPEC.md` 참조.
