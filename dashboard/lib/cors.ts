import { NextResponse } from "next/server";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// CORS 헤더를 붙인 JSON 응답. 프리플라이트만으로는 부족하므로 실제 응답에도 사용.
export function corsJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}
