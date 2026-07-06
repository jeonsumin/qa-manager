"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectSummary } from "@/lib/types";

function snippetFor(projectKey: string) {
  return `import { QAReportProvider } from "qa-report-sdk";

export default function App() {
  return (
    <QAReportProvider
      projectId="${projectKey}"
      apiBaseUrl="http://localhost:3000"
    >
      {/* 여기에 앱 컴포넌트 */}
    </QAReportProvider>
  );
}`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 접근 불가 시 무시
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
    >
      {copied ? "복사됨!" : label}
    </button>
  );
}

export default function SettingsClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`);
    setProject(res.ok ? await res.json() : null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function regenerate() {
    if (
      !confirm(
        "키를 재발급하면 기존 키로 연동된 곳은 더 이상 리포트를 보낼 수 없습니다. 계속하시겠습니까?"
      )
    ) {
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/regenerate-key`, {
      method: "POST",
    });
    if (res.ok) {
      await load();
    } else {
      alert("키 재발급에 실패했습니다.");
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl p-6 text-gray-500">불러오는 중…</main>;
  }
  if (!project) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-500">프로젝트를 찾을 수 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 text-sm">
        <Link
          href={`/projects/${projectId}`}
          className="text-blue-600 hover:underline"
        >
          ← 티켓 목록
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">{project.name} · 연동 설정</h1>

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">프로젝트 키</h2>
        <div className="flex flex-wrap items-center gap-3">
          <code
            className="rounded bg-gray-100 px-3 py-2 font-mono text-sm break-all"
            data-testid="project-key"
          >
            {project.projectKey}
          </code>
          <CopyButton text={project.projectKey} label="키 복사" />
          <button
            onClick={regenerate}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            data-testid="regenerate-key-btn"
          >
            키 재발급
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          이 키는 SDK의 <code>projectId</code> 값으로 사용합니다.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">연동 코드 스니펫</h2>
          <CopyButton text={snippetFor(project.projectKey)} label="스니펫 복사" />
        </div>
        <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
          <code>{snippetFor(project.projectKey)}</code>
        </pre>
      </section>
    </main>
  );
}
