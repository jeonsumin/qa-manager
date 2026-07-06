// 공용 헬퍼: 각 테스트가 자기 전용 프로젝트를 API로 생성해 격리한다.
export const API_BASE = 'http://localhost:3000';

export async function createProject(request, name) {
  const res = await request.post(`${API_BASE}/api/projects`, {
    data: { name, description: 'e2e 테스트용 프로젝트' },
  });
  if (res.status() !== 201) {
    throw new Error(`프로젝트 생성 실패: ${res.status()} ${await res.text()}`);
  }
  const project = await res.json();
  return project; // { id, name, projectKey, ... }
}

export async function getTickets(request, projectId) {
  const res = await request.get(`${API_BASE}/api/tickets?projectId=${projectId}`);
  if (!res.ok()) {
    throw new Error(`티켓 조회 실패: ${res.status()}`);
  }
  return res.json();
}

export async function getTicketDetail(request, ticketId) {
  const res = await request.get(`${API_BASE}/api/tickets/${ticketId}`);
  if (!res.ok()) {
    throw new Error(`티켓 상세 조회 실패: ${res.status()}`);
  }
  return res.json();
}

// 테스트가 생성한 프로젝트를 정리한다(티켓/첨부/코멘트는 Cascade 삭제).
// 정리 실패가 테스트 결과를 좌우하지 않도록 예외를 삼킨다.
export async function deleteProject(request, projectId) {
  if (!projectId) return;
  try {
    await request.delete(`${API_BASE}/api/projects/${projectId}`);
  } catch {
    // 정리 실패는 무시 (다음 실행에 영향 없음)
  }
}
