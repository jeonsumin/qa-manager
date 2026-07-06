// 리포트 폼 모달. SPEC 계약대로 POST /api/ingest/tickets 전송.
import React, { useMemo, useState } from 'react';
import RegionSelector from './RegionSelector.jsx';
import { submitTicket } from './api.js';

const Z = 2147483000;

const TYPE_OPTIONS = [
  { value: 'NETWORK_ERROR', label: '네트워크 에러' },
  { value: 'BUG', label: '기능 에러·버그' },
  { value: 'DESIGN', label: '디자인 수정' },
  { value: 'OTHER', label: '기타' },
];

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

export default function ReportForm({
  projectId,
  apiBaseUrl,
  screenshot,
  getLogs,
  onClose,
}) {
  const logs = useMemo(() => getLogs(), [getLogs]);

  const [type, setType] = useState('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState(
    typeof window !== 'undefined' ? window.location.href : ''
  );
  const [attachLogs, setAttachLogs] = useState(true);
  const [attachScreenshot, setAttachScreenshot] = useState(true);
  const [region, setRegion] = useState(null);
  const [toBe, setToBe] = useState('');

  const [selecting, setSelecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const consoleCount = logs.consoleErrors.length;
  const networkCount = logs.networkErrors.length;

  function handleRegionSelected(r) {
    setRegion(r);
    setSelecting(false);
  }

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
      // 완료 문구를 잠시 보여준 뒤 닫고 초기화 (onClose가 언마운트하며 상태 초기화)
      window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setSubmitting(false);
      setError((err && err.message) || '전송에 실패했습니다.');
    }
  }

  // 영역 선택 중에는 폼 모달을 숨기고 오버레이만 표시
  if (selecting) {
    return (
      <RegionSelector
        onSelect={handleRegionSelected}
        onCancel={() => setSelecting(false)}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z,
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
                스크린샷 첨부{!screenshot && ' (캡처 실패 — 사용 불가)'}
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
