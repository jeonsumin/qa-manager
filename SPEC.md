# QA 리포트 대시보드 — 계약 명세 (SPEC)

이 문서는 대시보드(백엔드 포함)와 연동 SDK가 공유하는 **고정 계약**이다.
구현자는 이 명세를 임의로 변경하지 말 것. 변경이 필요하면 사유를 보고할 것.

## 디렉토리 구조

```
qa/
  SPEC.md
  dashboard/     # Next.js (App Router) — 대시보드 UI + API 서버. 포트 3000
  sdk/           # (A) Context Provider 기반 React SDK 패키지
  sdk-single/    # (B) 복사-붙여넣기용 단일 파일 SDK
  demo/          # Vite React 데모 호스트 앱 (sdk를 사용). 포트 5173
  e2e/           # Playwright 통합 테스트
```

## 기술 스택

- dashboard: Next.js 15 (App Router, TypeScript), Prisma + MySQL 8 (루트 `docker-compose.yml`, `mysql://qa:qa@localhost:3306/qa`), Tailwind CSS
- sdk: React 18+ 호환, TypeScript 없이 순수 JSX(.jsx) — 호스트 프로젝트 제약 최소화. 스크린샷은 `html2canvas` (peer/직접 의존성)
- sdk-single: 의존성 0. html2canvas를 CDN에서 동적 `<script>` 로드, 실패 시 스크린샷 없이 진행
- demo: Vite + React, `sdk`를 상대 경로로 import
- e2e: Playwright (chromium)
- 패키지 매니저: npm. 워크스페이스 없이 각 디렉토리 독립 package.json

## 데이터 모델 (Prisma, MySQL)

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  projectKey  String   @unique        // 연동용 키. "qa_" + 32자 hex (crypto.randomBytes)
  createdAt   DateTime @default(now())
  tickets     Ticket[]
}

model Ticket {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        String   // "NETWORK_ERROR" | "BUG" | "DESIGN" | "OTHER"
  title       String   @db.VarChar(500)
  description String   @db.Text        // MySQL TEXT는 default 불가 — ingest에서 "" 보장
  status      String   @default("NEW") // "NEW" | "CONFIRMING" | "FIXING" | "DONE"
  pageUrl     String
  occurredAt  DateTime
  logs        String?  // JSON 문자열: {"consoleErrors":[...],"networkErrors":[...]} (아래 로그 형식 참조)
  region      String?  // 디자인 QA 영역. JSON 문자열: {"x","y","width","height","viewportWidth","viewportHeight"} (CSS px, 뷰포트 기준)
  toBe        String?  // 디자인 QA TO-BE 텍스트
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  attachments Attachment[]
  comments    Comment[]
}

model Attachment {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  kind      String   // "SCREENSHOT"
  filename  String   // uploads/ 내 실제 파일명
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author    String   // 자유 입력 이름 (인증 없음)
  body      String
  createdAt DateTime @default(now())
}
```

- 업로드 파일은 `dashboard/uploads/` 에 저장 (gitignore). 파일명은 `{attachmentId}.png` 형식.

## 로그 형식 (SDK가 수집, 서버는 그대로 저장)

```json
{
  "consoleErrors": [
    { "ts": "2026-07-06T10:00:00.000Z", "message": "문자열화된 에러 메시지", "stack": "선택" }
  ],
  "networkErrors": [
    { "ts": "...", "method": "GET", "url": "...", "status": 500, "statusText": "...", "error": "네트워크 실패 시 메시지" }
  ]
}
```
- 각 배열 최대 50개 (오래된 것부터 버림). status가 있으면 HTTP 에러 응답, error만 있으면 요청 자체 실패.

## API 계약 (모두 dashboard의 Next.js Route Handler)

### 공개 수집 API (외부 프로젝트에서 호출, CORS 허용)

`POST /api/ingest/tickets`
- CORS: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Content-Type`, OPTIONS 프리플라이트 처리 필수
- Request (JSON):
```json
{
  "projectKey": "qa_...",                  // 필수
  "type": "NETWORK_ERROR|BUG|DESIGN|OTHER", // 필수
  "title": "string",                        // 필수, 비어있으면 400
  "description": "string",                  // 선택
  "pageUrl": "string",                      // 필수
  "occurredAt": "ISO8601",                  // 선택, 없으면 서버 now
  "logs": { "consoleErrors": [], "networkErrors": [] },  // 선택
  "screenshot": "data:image/png;base64,...",              // 선택, data URL
  "region": { "x": 0, "y": 0, "width": 0, "height": 0, "viewportWidth": 0, "viewportHeight": 0 }, // 선택 (DESIGN)
  "toBe": "string"                           // 선택 (DESIGN)
}
```
- Response: `201 {"id": "<ticketId>"}` / `401 {"error":"invalid projectKey"}` / `400 {"error":"..."}`
- screenshot이 있으면 base64 디코드 → `uploads/` 저장 → Attachment(kind=SCREENSHOT) 생성.

### 대시보드 내부 API (인증 없음 — 내부 도구 가정)

- `GET /api/projects` → `[{id,name,description,projectKey,createdAt,ticketCounts:{NEW,CONFIRMING,FIXING,DONE}}]`
- `POST /api/projects` body `{name,description?}` → `201 {id,...,projectKey}`
- `GET /api/projects/:id` → 프로젝트 상세
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/regenerate-key` → `{projectKey}` (새 키)
- `GET /api/tickets?projectId=&status=&type=` → 티켓 배열 (최신순, attachments/comments 개수 포함)
- `GET /api/tickets/:id` → 티켓 상세 (attachments, comments 포함, logs/region은 파싱된 객체로)
- `PATCH /api/tickets/:id` body `{status}` → 갱신된 티켓
- `POST /api/tickets/:id/comments` body `{author,body}` → `201` 코멘트
- `GET /api/attachments/:id` → 파일 바이트 스트림 (Content-Type 설정)

## 대시보드 화면

1. `/` 프로젝트 목록: 카드/테이블, 상태별 티켓 개수 표시, "새 프로젝트" 생성 폼(이름/설명)
2. `/projects/[id]` 티켓 목록: 상태·유형 필터(쿼리스트링), 각 행에 유형/제목/상태/발생경로/발생시점. 상태 뱃지 한글: 신규/확인중/수정중/완료. 유형 한글: 네트워크 에러/기능 에러·버그/디자인 수정/기타
3. `/projects/[id]/settings` 연동 설정: projectKey 표시+복사 버튼, 키 재발급 버튼(확인 후), 연동 코드 스니펫(Provider 감싸는 예시 코드) 복사 버튼
4. `/tickets/[id]` 티켓 상세:
   - 기본 정보, 상태 변경 드롭다운(즉시 PATCH)
   - 로그 뷰어: consoleErrors / networkErrors를 접을 수 있는 목록으로
   - 스크린샷 표시. **DESIGN 티켓이면 스크린샷 위에 region을 빨간 반투명 박스로 오버레이** (region 좌표는 viewportWidth/Height 기준이므로 표시 이미지 크기에 비례 스케일링), TO-BE 텍스트 표시
   - 코멘트 목록 + 작성 폼(이름, 내용)

## SDK 동작 명세

### (A) sdk/ — Provider 패키지

```
sdk/
  package.json        # name: "qa-report-sdk", peerDeps: react, deps: html2canvas
  src/
    index.js          # export { QAReportProvider, useQAReport }
    QAReportProvider.jsx
    FloatingButton.jsx
    ReportForm.jsx
    RegionSelector.jsx
    collectors.js     # 콘솔/네트워크 에러 수집기
    capture.js        # html2canvas 래퍼
    api.js            # 전송
```

사용법: `<QAReportProvider projectId="qa_..." apiBaseUrl="http://localhost:3000">{children}</QAReportProvider>`

- Provider 마운트 시 수집기 설치: `window 'error'`, `'unhandledrejection'`, `console.error` 패치, `fetch` 패치(비 2xx 응답 + 요청 실패), `XMLHttpRequest` 패치. 링 버퍼 각 50개. 언마운트 시 원복.
- 플로팅 버튼: 우하단 고정, z-index 2147483000. 클릭하면 **모달을 열기 전에** html2canvas로 스크린샷 캡처(모달이 찍히지 않도록) 후 폼 모달 오픈.
- 리포트 폼: 유형 선택(4종), 제목, 설명, 발생 경로(현재 `location.href` 자동 채움, 수정 가능), "로그 첨부" 체크박스(수집된 콘솔 N건/네트워크 M건 표시, 기본 on), "스크린샷 첨부" 체크박스(캡처 미리보기 썸네일, 기본 on)
- 유형=디자인 수정 선택 시: "영역 선택" 버튼 표시 → 클릭하면 모달 숨김 → 전체 화면 오버레이에서 드래그로 사각형 선택 → 좌표(뷰포트 기준 CSS px) + viewport 크기 저장 → 모달 복귀, 선택 영역 좌표 표시 + TO-BE 텍스트 입력란 표시
- 전송: `POST {apiBaseUrl}/api/ingest/tickets` 위 계약대로. 성공 시 토스트/알림 후 폼 닫고 초기화, 실패 시 폼 유지 + 에러 메시지 표시.
- 모든 UI 문구는 한글.

### (B) sdk-single/ — 단일 파일

- `sdk-single/QAReportWidget.jsx` 파일 하나. (A)와 동일 동작을 단일 파일로 압축.
- html2canvas는 `https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js` 동적 로드. 로드 실패 시 스크린샷 체크박스 비활성 + 안내 문구.
- 사용법 주석을 파일 상단에: `<QAReportWidget projectId="..." apiBaseUrl="..." />`를 앱 아무 곳에 렌더.

## demo/ — 검증용 호스트 앱

- Vite React (JS). `App.jsx`에서 `QAReportProvider`로 감싼다 (projectId/apiBaseUrl은 `VITE_QA_PROJECT_KEY`, `VITE_QA_API_BASE` env 또는 하드코딩 기본값 `http://localhost:3000`).
- 테스트 트리거 버튼 3개: ① `console.error("데모 콘솔 에러")` 발생 ② `fetch("http://localhost:3000/api/nonexistent-endpoint-404")` 호출(네트워크 에러 로그 유발) ③ 임의 텍스트/박스가 있는 콘텐츠 영역(디자인 QA 드래그 대상)
- `data-testid` 부여: 트리거 버튼들, 콘텐츠 영역. SDK 쪽도 플로팅 버튼/폼 필드/제출 버튼에 `data-testid` 부여 (`qa-fab`, `qa-form`, `qa-type-select`, `qa-title-input`, `qa-desc-input`, `qa-region-button`, `qa-region-overlay`, `qa-tobe-input`, `qa-submit`).

## E2E (Playwright, e2e/)

전제: dashboard가 :3000, demo가 :5173에서 실행 중 (playwright config의 webServer로 자동 기동).

1. **프로젝트 발급~연동 흐름**: API로 프로젝트 생성 → projectKey 획득 → 그 키로 ingest POST → GET /api/tickets에 나타남 → 잘못된 키는 401
2. **SDK 로그/캡처 전달**: demo 접속 → 에러 트리거 버튼 2개 클릭 → 플로팅 버튼 클릭 → 폼 작성(BUG) → 제출 → API로 티켓 조회: logs에 consoleErrors/networkErrors 존재, SCREENSHOT attachment 존재, attachment GET이 image/png 반환
3. **디자인 QA 좌표**: demo에서 플로팅 버튼 → 유형=디자인 → 영역 선택 → 마우스 드래그(예: (100,100)→(300,250)) → TO-BE 입력 → 제출 → API 조회: region.x/y/width/height가 드래그 값과 일치(±2px), toBe 저장 확인

demo의 projectKey는 테스트 시작 시 API로 생성해 `VITE_QA_PROJECT_KEY`로 주입하거나, demo가 `window.__QA_PROJECT_KEY__`를 읽도록 하여 테스트에서 주입 — 구현자가 더 단순한 쪽 선택.

## 공통 원칙

- 과도한 추상화 금지. 인증/권한/멀티테넌시 없음. 검증은 사용자 입력과 ingest API 경계에서만.
- 에러 메시지·UI 문구 한글.
