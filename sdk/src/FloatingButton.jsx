// 우하단 고정 원형 버튼. 클릭 시 (Provider가) 캡처 먼저 실행 후 모달을 연다.
import React from 'react';

const Z = 2147483000;

export default function FloatingButton({ onClick, busy }) {
  return (
    <button
      type="button"
      data-testid="qa-fab"
      onClick={onClick}
      disabled={busy}
      aria-label="QA 리포트 작성"
      title="QA 리포트 작성"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: Z,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: busy ? '#9ca3af' : '#2563eb',
        color: '#fff',
        fontSize: 24,
        lineHeight: '56px',
        textAlign: 'center',
        cursor: busy ? 'wait' : 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        padding: 0,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {busy ? '…' : '🐞'}
    </button>
  );
}
