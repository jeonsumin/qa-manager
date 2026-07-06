/**
 * QAReportWidget — 복사-붙여넣기용 단일 파일 QA 리포트 위젯 (외부 의존성 0, react만 import)
 *
 * 사용법:
 *   import QAReportWidget from './QAReportWidget.jsx';
 *   // 앱 아무 곳에나 한 번 렌더하면 우하단에 플로팅 버튼이 생깁니다.
 *   <QAReportWidget projectId="qa_..." apiBaseUrl="http://localhost:3000" />
 *
 * 동작:
 *   - 마운트 시 console.error / window 'error' / 'unhandledrejection' / fetch / XMLHttpRequest 를
 *     패치하여 콘솔·네트워크 에러를 각 최대 50개까지 수집 (언마운트 시 원복).
 *   - 플로팅 버튼 클릭 시 모달을 열기 전에 html2canvas로 스크린샷을 캡처합니다.
 *     html2canvas는 CDN에서 동적으로 <script> 로드하며, 실패 시 스크린샷 없이 진행합니다.
 *   - 제출 시 POST {apiBaseUrl}/api/ingest/tickets 로 전송합니다.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

const FAB_Z = 2147483000;
const OVERLAY_Z = 2147483001;
const MAX = 50;
const HTML2CANVAS_CDN =
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

const TYPE_OPTIONS = [
  { value: 'NETWORK_ERROR', label: '네트워크 에러' },
  { value: 'BUG', label: '기능 에러·버그' },
  { value: 'DESIGN', label: '디자인 수정' },
  { value: 'OTHER', label: '기타' },
];

// ---------------------------------------------------------------------------
// 로그 수집기
// ---------------------------------------------------------------------------
function nowIso() {
  return new Date().toISOString();
}

function stringifyArg(a) {
  if (a instanceof Error) return a.message;
  if (typeof a === 'string') return a;
  if (a === undefined) return 'undefined';
  if (a === null) return 'null';
  try {
    return JSON.stringify(a);
  } catch {
    try {
      return String(a);
    } catch {
      return '[unserializable]';
    }
  }
}

function createCollectors() {
  const consoleErrors = [];
  const networkErrors = [];
  function pushConsole(item) {
    consoleErrors.push(item);
    if (consoleErrors.length > MAX) consoleErrors.shift();
  }
  function pushNetwork(item) {
    networkErrors.push(item);
    if (networkErrors.length > MAX) networkErrors.shift();
  }

  let installed = false;
  const origConsoleError = window.console.error;
  const origFetch = window.fetch;
  const OrigXHROpen = window.XMLHttpRequest.prototype.open;
  const OrigXHRSend = window.XMLHttpRequest.prototype.send;

  function onWindowError(event) {
    try {
      const err = event.error;
      pushConsole({
        ts: nowIso(),
        message: event.message || (err && err.message) || '알 수 없는 에러',
        stack: err && err.stack ? err.stack : undefined,
      });
    } catch {}
  }
  function onRejection(event) {
    try {
      const reason = event.reason;
      pushConsole({
        ts: nowIso(),
        message: reason instanceof Error ? reason.message : stringifyArg(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    } catch {}
  }

  function install() {
    if (installed) return;
    installed = true;
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onRejection);

    window.console.error = function () {
      const args = Array.prototype.slice.call(arguments);
      try {
        const errArg = args.find((a) => a instanceof Error);
        pushConsole({
          ts: nowIso(),
          message: args.map(stringifyArg).join(' '),
          stack: errArg ? errArg.stack : undefined,
        });
      } catch {}
      return origConsoleError.apply(window.console, args);
    };

    window.fetch = function (input, init) {
      let method = 'GET';
      let url = '';
      try {
        method =
          (init && init.method) ||
          (input && typeof input === 'object' && input.method) ||
          'GET';
        url =
          typeof input === 'string'
            ? input
            : (input && input.url) || String(input);
      } catch {}
      return origFetch.apply(this, arguments).then(
        (response) => {
          try {
            if (response && !response.ok) {
              pushNetwork({
                ts: nowIso(),
                method: String(method).toUpperCase(),
                url,
                status: response.status,
                statusText: response.statusText,
              });
            }
          } catch {}
          return response;
        },
        (err) => {
          try {
            pushNetwork({
              ts: nowIso(),
              method: String(method).toUpperCase(),
              url,
              error: (err && err.message) || String(err),
            });
          } catch {}
          throw err;
        }
      );
    };

    window.XMLHttpRequest.prototype.open = function (method, url) {
      try {
        this.__qaMethod = method;
        this.__qaUrl = url;
      } catch {}
      return OrigXHROpen.apply(this, arguments);
    };
    window.XMLHttpRequest.prototype.send = function () {
      const xhr = this;
      try {
        xhr.addEventListener('loadend', function () {
          try {
            if (xhr.status >= 400) {
              pushNetwork({
                ts: nowIso(),
                method: String(xhr.__qaMethod || 'GET').toUpperCase(),
                url: xhr.__qaUrl || '',
                status: xhr.status,
                statusText: xhr.statusText,
              });
            }
          } catch {}
        });
        xhr.addEventListener('error', function () {
          try {
            pushNetwork({
              ts: nowIso(),
              method: String(xhr.__qaMethod || 'GET').toUpperCase(),
              url: xhr.__qaUrl || '',
              error: '네트워크 요청 실패',
            });
          } catch {}
        });
      } catch {}
      return OrigXHRSend.apply(this, arguments);
    };
  }

  function uninstall() {
    if (!installed) return;
    installed = false;
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onRejection);
    window.console.error = origConsoleError;
    window.fetch = origFetch;
    window.XMLHttpRequest.prototype.open = OrigXHROpen;
    window.XMLHttpRequest.prototype.send = OrigXHRSend;
  }

  function getLogs() {
    return {
      consoleErrors: consoleErrors.slice(),
      networkErrors: networkErrors.slice(),
    };
  }

  return { install, uninstall, getLogs };
}

// ---------------------------------------------------------------------------
// html2canvas CDN 동적 로드
// ---------------------------------------------------------------------------
let html2canvasPromise = null;
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HTML2CANVAS_CDN;
    script.async = true;
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => {
      html2canvasPromise = null;
      reject(new Error('html2canvas 로드 실패'));
    };
    document.head.appendChild(script);
  });
  return html2canvasPromise;
}

async function captureScreenshot() {
  try {
    const h2c = await loadHtml2Canvas();
    if (!h2c) return null;
    const canvas = await h2c(document.body, { useCORS: true });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('[QA SDK] 스크린샷 캡처 실패:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 전송
// ---------------------------------------------------------------------------
async function submitTicket(apiBaseUrl, payload) {
  const base = String(apiBaseUrl || '').replace(/\/+$/, '');
  const res = await fetch(`${base}/api/ingest/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = `서버 오류가 발생했습니다 (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// 영역 선택 오버레이
// ---------------------------------------------------------------------------
function RegionSelector({ onSelect, onCancel }) {
  const [start, setStart] = useState(null);
  const [current, setCurrent] = useState(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  function rectFrom(a, b) {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x),
      height: Math.abs(a.y - b.y),
    };
  }
  function handleDown(e) {
    e.preventDefault();
    draggingRef.current = true;
    const pt = { x: e.clientX, y: e.clientY };
    setStart(pt);
    setCurrent(pt);
  }
  function handleMove(e) {
    if (!draggingRef.current) return;
    setCurrent({ x: e.clientX, y: e.clientY });
  }
  function handleUp(e) {
    if (!draggingRef.current || !start) return;
    draggingRef.current = false;
    const r = rectFrom(start, { x: e.clientX, y: e.clientY });
    if (r.width < 3 || r.height < 3) {
      onCancel();
      return;
    }
    onSelect({
      x: Math.round(r.x),
      y: Math.round(r.y),
      width: Math.round(r.width),
      height: Math.round(r.height),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }

  const box = start && current ? rectFrom(start, current) : null;

  return (
    <div
      data-testid="qa-region-overlay"
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: OVERLAY_Z,
        background: 'rgba(0,0,0,0.35)',
        cursor: 'crosshair',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(17,24,39,0.9)',
          color: '#fff',
          padding: '8px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
        }}
      >
        드래그하여 영역을 선택하세요 · ESC로 취소
      </div>
      {box && (
        <div
          style={{
            position: 'fixed',
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            border: '2px solid #ef4444',
            background: 'rgba(239,68,68,0.15)',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 위젯
// ---------------------------------------------------------------------------
const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#374151',
};
const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  fontSize: 14,
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontFamily: 'inherit',
};

export default function QAReportWidget({
  projectId,
  apiBaseUrl = 'http://localhost:3000',
}) {
  const collectorsRef = useRef(null);
  const [screenshotSupported, setScreenshotSupported] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [screenshot, setScreenshot] = useState(null);

  useEffect(() => {
    const collectors = createCollectors();
    collectors.install();
    collectorsRef.current = collectors;
    return () => {
      collectors.uninstall();
      collectorsRef.current = null;
    };
  }, []);

  const getLogs = () =>
    collectorsRef.current
      ? collectorsRef.current.getLogs()
      : { consoleErrors: [], networkErrors: [] };

  async function handleOpen() {
    if (busy || open) return;
    setBusy(true);
    let shot = null;
    if (screenshotSupported) {
      shot = await captureScreenshot();
      if (!shot && !window.html2canvas) setScreenshotSupported(false);
    }
    setScreenshot(shot);
    setBusy(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setScreenshot(null);
  }

  return (
    <>
      <button
        type="button"
        data-testid="qa-fab"
        onClick={handleOpen}
        disabled={busy}
        aria-label="QA 리포트 작성"
        title="QA 리포트 작성"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: FAB_Z,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: busy ? '#9ca3af' : '#2563eb',
          color: '#fff',
          fontSize: 24,
          cursor: busy ? 'wait' : 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          padding: 0,
        }}
      >
        {busy ? '…' : '🐞'}
      </button>
      {open && (
        <Modal
          projectId={projectId}
          apiBaseUrl={apiBaseUrl}
          screenshot={screenshot}
          screenshotSupported={screenshotSupported}
          getLogs={getLogs}
          onClose={handleClose}
        />
      )}
    </>
  );
}

function Modal({
  projectId,
  apiBaseUrl,
  screenshot,
  screenshotSupported,
  getLogs,
  onClose,
}) {
  const logs = useMemo(() => getLogs(), [getLogs]);
  const [type, setType] = useState('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState(window.location.href);
  const [attachLogs, setAttachLogs] = useState(true);
  const [attachScreenshot, setAttachScreenshot] = useState(!!screenshot);
  const [region, setRegion] = useState(null);
  const [toBe, setToBe] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const consoleCount = logs.consoleErrors.length;
  const networkCount = logs.networkErrors.length;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    const payload = {
      projectKey: projectId,
      type,
      title: title.trim(),
      description,
      pageUrl,
      occurredAt: new Date().toISOString(),
    };
    if (attachLogs) payload.logs = logs;
    if (attachScreenshot && screenshot) payload.screenshot = screenshot;
    if (type === 'DESIGN') {
      if (region) payload.region = region;
      if (toBe.trim()) payload.toBe = toBe;
    }
    try {
      await submitTicket(apiBaseUrl, payload);
      setSuccess(true);
      setSubmitting(false);
      window.setTimeout(() => onClose(), 1200);
    } catch (err) {
      setSubmitting(false);
      setError((err && err.message) || '전송에 실패했습니다.');
    }
  }

  if (selecting) {
    return (
      <RegionSelector
        onSelect={(r) => {
          setRegion(r);
          setSelecting(false);
        }}
        onCancel={() => setSelecting(false)}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: FAB_Z,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        data-testid="qa-form"
        onSubmit={handleSubmit}
        style={{
          width: 'min(460px, 92vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          color: '#111827',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>QA 리포트 작성</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div
            style={{
              padding: '24px 8px',
              textAlign: 'center',
              color: '#059669',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            리포트가 전송되었습니다. 감사합니다!
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle} htmlFor="qa-type">
                유형
              </label>
              <select
                id="qa-type"
                data-testid="qa-type-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={inputStyle}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle} htmlFor="qa-title">
                제목
              </label>
              <input
                id="qa-title"
                data-testid="qa-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="무엇이 문제인가요?"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle} htmlFor="qa-desc">
                설명
              </label>
              <textarea
                id="qa-desc"
                data-testid="qa-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="자세한 재현 방법이나 상황을 적어주세요. (선택)"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle} htmlFor="qa-page-url">
                발생 경로
              </label>
              <input
                id="qa-page-url"
                type="text"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                style={inputStyle}
              />
            </div>

            {type === 'DESIGN' && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}
              >
                <button
                  type="button"
                  data-testid="qa-region-button"
                  onClick={() => setSelecting(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    border: '1px solid #2563eb',
                    color: '#2563eb',
                    background: '#fff',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  영역 선택
                </button>
                {region ? (
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>
                    선택된 영역: x={region.x}, y={region.y}, w={region.width}, h=
                    {region.height} (뷰포트 {region.viewportWidth}×
                    {region.viewportHeight})
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                    아직 선택된 영역이 없습니다.
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <label style={labelStyle} htmlFor="qa-tobe">
                    TO-BE (개선안)
                  </label>
                  <textarea
                    id="qa-tobe"
                    data-testid="qa-tobe-input"
                    value={toBe}
                    onChange={(e) => setToBe(e.target.value)}
                    placeholder="어떻게 바뀌면 좋을지 적어주세요."
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={attachLogs}
                  onChange={(e) => setAttachLogs(e.target.checked)}
                />
                로그 첨부 (콘솔 {consoleCount}건 / 네트워크 {networkCount}건)
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={attachScreenshot}
                  disabled={!screenshot}
                  onChange={(e) => setAttachScreenshot(e.target.checked)}
                />
                스크린샷 첨부
                {!screenshotSupported && ' (html2canvas 로드 실패 — 사용 불가)'}
                {screenshotSupported && !screenshot && ' (캡처 실패 — 사용 불가)'}
              </label>
              {attachScreenshot && screenshot && (
                <img
                  src={screenshot}
                  alt="스크린샷 미리보기"
                  style={{
                    marginTop: 8,
                    maxWidth: '100%',
                    maxHeight: 140,
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    display: 'block',
                  }}
                />
              )}
            </div>

            {error && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '8px 10px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="qa-submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 0',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                borderRadius: 8,
                background: submitting ? '#9ca3af' : '#2563eb',
                color: '#fff',
                cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {submitting ? '전송 중…' : '제출'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
