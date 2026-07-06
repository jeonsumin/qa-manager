"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectSummary, TicketListItem } from "@/lib/types";
import { StatusBadge, TypeBadge } from "@/app/components/Badges";
import { STATUS_ORDER, TYPE_ORDER, statusLabel, typeLabel } from "@/lib/labels";

export default function TicketListClient({
  projectId,
  status,
  type,
}: {
  projectId: string;
  status: string;
  type: string;
}) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ projectId });
      if (status) qs.set("status", status);
      if (type) qs.set("type", type);
      const [pRes, tRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/tickets?${qs.toString()}`),
      ]);
      setProject(pRes.ok ? await pRes.json() : null);
      setTickets(tRes.ok ? await tRes.json() : []);
    } finally {
      setLoading(false);
    }
  }, [projectId, status, type]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilter(key: "status" | "type", value: string) {
    const qs = new URLSearchParams();
    const nextStatus = key === "status" ? value : status;
    const nextType = key === "type" ? value : type;
    if (nextStatus) qs.set("status", nextStatus);
    if (nextType) qs.set("type", nextType);
    const query = qs.toString();
    router.push(`/projects/${projectId}${query ? `?${query}` : ""}`);
  }

  function fmt(d: string) {
    return new Date(d).toLocaleString("ko-KR");
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← 프로젝트 목록
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {project ? project.name : "프로젝트"}
        </h1>
        <Link
          href={`/projects/${projectId}/settings`}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          연동 설정
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          상태
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={status}
            onChange={(e) => updateFilter("status", e.target.value)}
            data-testid="filter-status"
          >
            <option value="">전체</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          유형
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={type}
            onChange={(e) => updateFilter("type", e.target.value)}
            data-testid="filter-type"
          >
            <option value="">전체</option>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {typeLabel(t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">불러오는 중…</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-500">티켓이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-2">유형</th>
                <th className="px-4 py-2">제목</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2">발생 경로</th>
                <th className="px-4 py-2">발생 시점</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => router.push(`/tickets/${t.id}`)}
                >
                  <td className="px-4 py-2">
                    <TypeBadge type={t.type} />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/tickets/${t.id}`}
                      className="font-medium text-blue-700 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.title}
                    </Link>
                    <span className="ml-2 text-xs text-gray-400">
                      💬 {t.commentCount} · 📎 {t.attachmentCount}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-2 text-gray-500">
                    {t.pageUrl}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                    {fmt(t.occurredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
