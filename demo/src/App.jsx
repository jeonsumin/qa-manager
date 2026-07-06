import { QAReportProvider } from '../../sdk/src/index.js'
import './App.css'

// projectKey는 window 주입 → env → 기본값 순으로 읽는다 (E2E가 window 주입 방식을 쓸 수 있게).
const projectKey =
  (typeof window !== 'undefined' && window.__QA_PROJECT_KEY__) ||
  import.meta.env.VITE_QA_PROJECT_KEY ||
  'qa_demo'

const apiBaseUrl = import.meta.env.VITE_QA_API_BASE || 'http://localhost:3000'

function triggerConsoleError() {
  console.error('데모 콘솔 에러', new Error('의도적으로 발생시킨 데모 에러'))
}

function triggerNetworkError() {
  // 존재하지 않는 엔드포인트 호출 → 네트워크 에러 로그 유발 (서버 미기동 시 요청 실패로 기록)
  fetch('http://localhost:3000/api/nonexistent-endpoint-404').catch(() => {
    /* 실패는 SDK 수집기가 기록한다 */
  })
}

export default function App() {
  return (
    <QAReportProvider projectId={projectKey} apiBaseUrl={apiBaseUrl}>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        <h1>QA 리포트 SDK 데모</h1>
        <p style={{ color: '#4b5563' }}>
          우하단의 🐞 버튼을 눌러 리포트를 작성해 보세요. 아래 버튼으로 에러
          로그를 미리 만들 수 있습니다.
        </p>

        <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '24px 0' }}>
          <button
            type="button"
            data-testid="trigger-console-error"
            onClick={triggerConsoleError}
            style={btnStyle}
          >
            콘솔 에러 발생시키기
          </button>
          <button
            type="button"
            data-testid="trigger-network-error"
            onClick={triggerNetworkError}
            style={btnStyle}
          >
            네트워크 에러 발생시키기
          </button>
        </section>

        <section
          data-testid="demo-content"
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 20,
            background: '#fff',
          }}
        >
          <h2>디자인 QA 대상 콘텐츠</h2>
          <p>
            디자인 수정 리포트를 작성할 때 이 영역을 드래그로 선택해 보세요. 아래
            색상 박스들도 선택 대상이 됩니다.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <div style={{ ...boxStyle, background: '#ef4444' }}>빨강</div>
            <div style={{ ...boxStyle, background: '#3b82f6' }}>파랑</div>
            <div style={{ ...boxStyle, background: '#10b981' }}>초록</div>
            <div style={{ ...boxStyle, background: '#f59e0b' }}>주황</div>
          </div>
        </section>

        <p style={{ marginTop: 24, fontSize: 13, color: '#9ca3af' }}>
          projectKey: <code>{projectKey}</code> · API: <code>{apiBaseUrl}</code>
        </p>
      </main>
    </QAReportProvider>
  )
}

const btnStyle = {
  padding: '10px 16px',
  fontSize: 14,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
}

const boxStyle = {
  width: 90,
  height: 90,
  borderRadius: 8,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
}
