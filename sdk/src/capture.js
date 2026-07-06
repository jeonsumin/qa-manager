// html2canvas 래퍼. 실패 시 null 반환 (수집기에 잡히지 않게 console.warn 사용 — console.error 금지).
import html2canvas from 'html2canvas';

export async function captureScreenshot() {
  try {
    const canvas = await html2canvas(document.body, { useCORS: true });
    return canvas.toDataURL('image/png');
  } catch (e) {
    // console.error 패치가 이 경고를 로그로 수집하지 않도록 반드시 console.warn 사용
    console.warn('[QA SDK] 스크린샷 캡처 실패:', e);
    return null;
  }
}
