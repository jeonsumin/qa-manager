// 티켓 전송. SPEC의 POST /api/ingest/tickets 계약대로.

export async function submitTicket(apiBaseUrl, payload) {
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
    } catch {
      /* 본문 파싱 실패는 무시하고 기본 메시지 사용 */
    }
    throw new Error(message);
  }

  return res.json();
}
