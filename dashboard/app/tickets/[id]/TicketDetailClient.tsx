"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TicketDetail } from "@/lib/types";
import { StatusBadge, TypeBadge } from "@/app/components/Badges";
import { STATUS_ORDER, statusLabel } from "@/lib/labels";
import RegionScreenshot from "./RegionScreenshot";

function fmt(d: string) {
  return new Date(d).toLocaleString("ko-KR");
}

function Collapsible({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded border border-gray-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-gray-50"
      >
        <span>
          {title} <span className="text-gray-400">({count})</span>
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="border-t border-gray-100 p-3">{children}</div>}
    </div>
  );
}

export default function TicketDetailClient({
  ticketId,
}: {
  ticketId: string;
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [author, setAuthor] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (res.status === 404) {
      setNotFound(true);
      setTicket(null);
    } else if (res.ok) {
      setTicket(await res.json());
    }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: string) {
    setSavingStatus(true);
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTicket((t) => (t ? { ...t, status } : t));
    } else {
      alert("상태 변경에 실패했습니다.");
    }
    setSavingStatus(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !commentBody.trim()) {
      setCommentError("이름과 내용을 모두 입력하세요.");
      return;
    }
    setSubmittingComment(true);
    setCommentError("");
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, body: commentBody }),
    });
    if (res.ok) {
      setCommentBody("");
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      setCommentError(d.error || "코멘트 작성에 실패했습니다.");
    }
    setSubmittingComment(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-gray-500">불러오는 중…</main>
    );
  }
  if (notFound || !ticket) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-500">티켓을 찾을 수 없습니다.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← 프로젝트 목록
        </Link>
      </main>
    );
  }

  const console_ = ticket.logs?.consoleErrors ?? [];
  const network = ticket.logs?.networkErrors ?? [];
  const screenshot = ticket.attachments.find((a) => a.kind === "SCREENSHOT");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 text-sm">
        <Link
          href={`/projects/${ticket.projectId}`}
          className="text-blue-600 hover:underline"
        >
          ← {ticket.project?.name ?? "티켓 목록"}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TypeBadge type={ticket.type} />
        <StatusBadge status={ticket.status} />
      </div>
      <h1 className="mb-4 text-2xl font-bold">{ticket.title}</h1>

      {/* 기본 정보 */}
      <section className="mb-6 grid gap-2 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-gray-500">상태 변경</span>
          <select
            value={ticket.status}
            disabled={savingStatus}
            onChange={(e) => changeStatus(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
            data-testid="status-select"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <InfoRow label="발생 경로">
          <a
            href={ticket.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-blue-600 hover:underline"
          >
            {ticket.pageUrl}
          </a>
        </InfoRow>
        <InfoRow label="발생 시점">{fmt(ticket.occurredAt)}</InfoRow>
        <InfoRow label="생성 시점">{fmt(ticket.createdAt)}</InfoRow>
        {ticket.description && (
          <InfoRow label="설명">
            <span className="whitespace-pre-wrap">{ticket.description}</span>
          </InfoRow>
        )}
      </section>

      {/* 로그 뷰어 */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">로그</h2>
        <div className="flex flex-col gap-2">
          <Collapsible title="콘솔 에러" count={console_.length}>
            {console_.length === 0 ? (
              <p className="text-sm text-gray-500">수집된 콘솔 에러가 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {console_.map((c, i) => (
                  <li key={i} className="rounded bg-gray-50 p-2 text-xs">
                    <div className="text-gray-400">{c.ts}</div>
                    <div className="font-mono break-all whitespace-pre-wrap">
                      {c.message}
                    </div>
                    {c.stack && (
                      <pre className="mt-1 overflow-x-auto text-gray-500">
                        {c.stack}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Collapsible>
          <Collapsible title="네트워크 에러" count={network.length}>
            {network.length === 0 ? (
              <p className="text-sm text-gray-500">
                수집된 네트워크 에러가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {network.map((n, i) => (
                  <li key={i} className="rounded bg-gray-50 p-2 text-xs">
                    <div className="text-gray-400">{n.ts}</div>
                    <div className="font-mono break-all">
                      {n.status ? (
                        <span className="font-semibold text-red-600">
                          {n.status} {n.statusText}
                        </span>
                      ) : (
                        <span className="font-semibold text-red-600">
                          요청 실패
                        </span>
                      )}{" "}
                      {n.method} {n.url}
                    </div>
                    {n.error && (
                      <div className="text-gray-500">{n.error}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Collapsible>
        </div>
      </section>

      {/* 스크린샷 + region 오버레이 */}
      {screenshot && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">스크린샷</h2>
          <RegionScreenshot
            src={`/api/attachments/${screenshot.id}`}
            region={ticket.type === "DESIGN" ? ticket.region : null}
          />
        </section>
      )}

      {/* 스크린샷이 없어도 지정 영역 좌표는 확인할 수 있게 텍스트로 노출 */}
      {ticket.type === "DESIGN" && ticket.region && !screenshot && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">지정 영역</h2>
          <p className="rounded border border-gray-200 bg-white p-3 text-sm">
            x={ticket.region.x}, y={ticket.region.y}, 너비=
            {ticket.region.width}, 높이={ticket.region.height} (뷰포트{" "}
            {ticket.region.viewportWidth}×{ticket.region.viewportHeight} 기준)
          </p>
        </section>
      )}

      {/* TO-BE */}
      {ticket.type === "DESIGN" && ticket.toBe && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">TO-BE (개선안)</h2>
          <p className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm">
            {ticket.toBe}
          </p>
        </section>
      )}

      {/* 코멘트 */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">
          코멘트 ({ticket.comments.length})
        </h2>
        <div className="mb-3 flex flex-col gap-2">
          {ticket.comments.length === 0 ? (
            <p className="text-sm text-gray-500">아직 코멘트가 없습니다.</p>
          ) : (
            ticket.comments.map((c) => (
              <div
                key={c.id}
                className="rounded border border-gray-200 bg-white p-3 text-sm"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold">{c.author}</span>
                  <span className="text-xs text-gray-400">
                    {fmt(c.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={submitComment}
          className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4"
        >
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="이름"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            data-testid="comment-author"
          />
          <textarea
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="내용"
            rows={3}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            data-testid="comment-body"
          />
          {commentError && (
            <p className="text-sm text-red-600">{commentError}</p>
          )}
          <button
            type="submit"
            disabled={submittingComment}
            className="self-start rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            data-testid="comment-submit"
          >
            {submittingComment ? "등록 중…" : "코멘트 등록"}
          </button>
        </form>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
