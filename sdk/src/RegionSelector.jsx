// 전체 화면 반투명 오버레이. 드래그로 사각형 영역 선택.
// 좌표는 뷰포트 기준 CSS px. mouseup에서 확정, ESC로 취소.
import React, { useEffect, useRef, useState } from 'react';

const Z = 2147483001; // 폼 모달보다 위

export default function RegionSelector({ onSelect, onCancel }) {
  const [start, setStart] = useState(null); // {x, y} 뷰포트 기준
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
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const width = Math.abs(a.x - b.x);
    const height = Math.abs(a.y - b.y);
    return { x, y, width, height };
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
    const end = { x: e.clientX, y: e.clientY };
    const r = rectFrom(start, end);
    // 너무 작은 선택(클릭)은 취소로 간주
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
        zIndex: Z,
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
