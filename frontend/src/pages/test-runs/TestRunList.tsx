import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTestRunStore } from '../../store/testRunStore';
import { useTestCaseStore } from '../../store/testCaseStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';
import type { TestCase } from '../../types/testCase';

export default function TestRunList() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const { runs, loading, fetchRuns, createRun, deleteRun } = useTestRunStore();
  const { cases, fetchCases } = useTestCaseStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', description: '', environment: '' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchRuns(pid); }, [pid]);

  const openModal = () => { setStep(1); setForm({ name: '', description: '', environment: '' }); setSelectedIds([]); setModalOpen(true); fetchCases(pid); };
  const toggleCase = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const run = await createRun(pid, { ...form, testCaseIds: selectedIds });
      setModalOpen(false);
      navigate(`/projects/${pid}/test-runs/${run.id}`);
    } finally { setSaving(false); }
  };

  const passRate = (stats: { total: number; pass: number }) => stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">테스트런</h1>
        <Button onClick={openModal}>+ 새 테스트런</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? <div className="py-16 text-center text-gray-400">로딩 중...</div>
          : runs.length === 0 ? <EmptyState message="테스트런이 없습니다." />
          : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50 text-gray-500 text-left">
                <th className="px-5 py-3 font-medium">테스트런</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">케이스</th>
                <th className="px-5 py-3 font-medium w-40">Pass율</th>
                <th className="px-5 py-3 font-medium">Pass/Fail/Blocked</th>
                <th className="px-5 py-3 font-medium">생성일</th>
              </tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/projects/${pid}/test-runs/${r.id}`)} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3 font-medium text-blue-600">{r.name}</td>
                    <td className="px-5 py-3"><Badge value={r.status} /></td>
                    <td className="px-5 py-3">{r.stats.total}</td>
                    <td className="px-5 py-3"><ProgressBar value={passRate(r.stats)} showLabel color="bg-green-500" /></td>
                    <td className="px-5 py-3 text-gray-500">{r.stats.pass} / {r.stats.fail} / {r.stats.blocked}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="새 테스트런" size="lg">
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Step 1 / 2 — 기본 정보</p>
            <div>
              <label htmlFor="testrun-name" className="block text-sm font-medium text-gray-700 mb-1">테스트런 이름 *</label>
              <input id="testrun-name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">환경 (브라우저/OS)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} placeholder="예: Chrome 120 / macOS" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
              <Button onClick={() => setStep(2)} disabled={!form.name.trim()}>다음</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Step 2 / 2 — 테스트 케이스 선택</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedIds(cases.map((c: TestCase) => c.id))} className="text-sm text-blue-600 hover:underline">전체 선택</button>
              <button onClick={() => setSelectedIds([])} className="text-sm text-gray-500 hover:underline">전체 해제</button>
              <span className="text-sm text-gray-400">{selectedIds.length}개 선택됨</span>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {cases.map((tc: TestCase) => (
                <label key={tc.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selectedIds.includes(tc.id)} onChange={() => toggleCase(tc.id)} className="rounded" />
                  <span className="text-sm flex-1">{tc.title}</span>
                  <Badge value={tc.priority} />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>이전</Button>
              <Button onClick={handleCreate} disabled={saving || selectedIds.length === 0}>{saving ? '생성 중...' : '테스트런 생성'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
