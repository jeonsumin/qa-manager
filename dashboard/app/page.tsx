"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectSummary } from "@/lib/types";
import { STATUS_ORDER, statusLabel } from "@/lib/labels";

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {
      setError("프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "프로젝트 생성에 실패했습니다.");
        return;
      }
      setName("");
      setDescription("");
      await load();
    } catch {
      setError("프로젝트 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">QA 리포트 대시보드</h1>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">새 프로젝트</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            className="rounded border border-gray-300 px-3 py-2"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="project-name-input"
          />
          <textarea
            className="rounded border border-gray-300 px-3 py-2"
            placeholder="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            data-testid="project-desc-input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            data-testid="project-create-btn"
          >
            {submitting ? "생성 중…" : "프로젝트 생성"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">프로젝트 목록</h2>
        {loading ? (
          <p className="text-gray-500">불러오는 중…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">아직 프로젝트가 없습니다.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <Link
                    href={`/projects/${p.id}/settings`}
                    className="text-sm text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    설정
                  </Link>
                </div>
                {p.description && (
                  <p className="mb-2 text-sm text-gray-600">{p.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {STATUS_ORDER.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-gray-100 px-2 py-1 text-gray-700"
                    >
                      {statusLabel(s)} {p.ticketCounts[s] ?? 0}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
