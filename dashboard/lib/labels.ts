// 한글 문구 매핑 (SPEC 대시보드 화면 참조)

export const STATUS_LABELS: Record<string, string> = {
  NEW: "신규",
  CONFIRMING: "확인중",
  FIXING: "수정중",
  DONE: "완료",
};

export const STATUS_ORDER = ["NEW", "CONFIRMING", "FIXING", "DONE"] as const;

export const TYPE_LABELS: Record<string, string> = {
  NETWORK_ERROR: "네트워크 에러",
  BUG: "기능 에러·버그",
  DESIGN: "디자인 수정",
  OTHER: "기타",
};

export const TYPE_ORDER = ["NETWORK_ERROR", "BUG", "DESIGN", "OTHER"] as const;

export function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s;
}

export function typeLabel(t: string) {
  return TYPE_LABELS[t] ?? t;
}
