import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTestRunStore } from '../../store/testRunStore';
import { useIssueStore } from '../../store/issueStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import { SEVERITY_OPTIONS } from '../../utils/constants';
import type { TestRunResult } from '../../types/testRun';

const RESULT_DOT: Record<string, string> = {
  pass: 'bg-green-500', fail: 'bg-red-500', blocked: 'bg-orange-500', 'not-run': 'bg-gray-300',
};

export default function TestRunDetail() {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>();
  const pid = Number(projectId);
  const rid = Number(runId);
  const { currentRun, loading, fetchRun, updateRun, updateResult } = useTestRunStore();
  const { createIssue } = useIssueStore();
  const [selected, setSelected] = useState<TestRunResult | null>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: '', severity: 'major', description: '', stepsToReproduce: '', expectedResult: '', actualResult: '' });

  useEffect(() => { fetchRun(pid, rid); }, [pid, rid]);
  useEffect(() => { if (selected) setComment(selected.comment || ''); }, [selected?.id]);

  const filteredResults = (currentRun?.results || []).filter(r =>
    filter === 'all' || r.status === filter
  );

  const handleResult = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateResult(pid, rid, selected.id, status, comment);
      await fetchRun(pid, rid);
      const updated = currentRun?.results?.find(r => r.id === selected.id);
      if (updated) setSelected({ ...updated, status: status as TestRunResult['status'], comment });
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    await updateRun(pid, rid, { status: 'completed' });
    fetchRun(pid, rid);
  };

  const handleCreateIssue = async () => {
    await createIssue(pid, { ...issueForm as Partial<import('../../types/issue').Issue>, testCaseId: selected?.testCaseId, testRunResultId: selected?.id });
    setIssueModal(false);
  };

  const stats = currentRun?.stats;
  const total = stats?.total || 0;
  const doneCount = (stats?.pass || 0) + (stats?.fail || 0) + (stats?.blocked || 0);

  if (loading && !currentRun) return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;
  if (!currentRun) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 rounded-t-xl">
        <h1 className="font-bold text-gray-900 text-lg truncate flex-1">{currentRun.name}</h1>
        <Badge value={currentRun.status} />
        {currentRun.environment && <span className="text-sm text-gray-500">{currentRun.environment}</span>}
        <div className="w-40"><ProgressBar value={total > 0 ? (doneCount / total) * 100 : 0} showLabel /></div>
        {currentRun.status !== 'completed' && (
          <Button size="sm" variant="secondary" onClick={handleComplete}>완료 처리</Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="bg-gray-50 border-b px-4 py-2 flex gap-4 text-sm">
        {(['not-run', 'pass', 'fail', 'blocked'] as const).map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${RESULT_DOT[s]}`} />
            <span className="text-gray-500">{s === 'not-run' ? 'Not Run' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
            <strong>{s === 'not-run' ? stats?.notRun : s === 'pass' ? stats?.pass : s === 'fail' ? stats?.fail : stats?.blocked}</strong>
          </span>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 border-r bg-white overflow-y-auto flex flex-col">
          <div className="flex gap-1 p-2 border-b text-xs">
            {['all', 'not-run', 'pass', 'fail', 'blocked'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded ${filter === f ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
                {f === 'all' ? '전체' : f === 'not-run' ? 'Not Run' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filteredResults.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-gray-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${RESULT_DOT[r.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.testCase.title}</p>
                  {r.testCase.category && <p className="text-xs text-gray-400 truncate">{r.testCase.category}</p>}
                </div>
                <Badge value={r.testCase.priority} />
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto bg-white p-5">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>좌측에서 테스트 케이스를 선택하세요</p>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 flex-1">{selected.testCase.title}</h2>
                <Badge value={selected.testCase.priority} />
                {selected.testCase.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selected.testCase.category}</span>}
              </div>

              {selected.testCase.precondition && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-700 mb-1">사전 조건</p>
                  <p className="text-sm text-yellow-800 whitespace-pre-line">{selected.testCase.precondition}</p>
                </div>
              )}
              {selected.testCase.steps && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">테스트 단계</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">{selected.testCase.steps}</p>
                </div>
              )}
              {selected.testCase.expectedResult && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">기대 결과</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">{selected.testCase.expectedResult}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">현재 상태: <Badge value={selected.status} /></p>
                <div className="flex gap-2 mb-3">
                  {(['pass', 'fail', 'blocked'] as const).map(s => (
                    <Button key={s} size="sm"
                      variant={selected.status === s ? 'primary' : 'secondary'}
                      onClick={() => handleResult(s)}
                      disabled={saving}
                      className={s === 'fail' ? 'border-red-300 text-red-600 hover:bg-red-50' : s === 'blocked' ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : ''}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                  {selected.status !== 'not-run' && (
                    <Button size="sm" variant="ghost" onClick={() => handleResult('not-run')} disabled={saving}>초기화</Button>
                  )}
                </div>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3} placeholder="코멘트 입력..." value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                {selected.status === 'fail' && (
                  <Button size="sm" variant="danger" className="mt-2" onClick={() => {
                    setIssueForm({ title: `[${selected.testCase.category || '기타'}] ${selected.testCase.title}`, severity: 'major', description: '', stepsToReproduce: selected.testCase.steps || '', expectedResult: selected.testCase.expectedResult || '', actualResult: '' });
                    setIssueModal(true);
                  }}>이슈 등록</Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={issueModal} onClose={() => setIssueModal(false)} title="이슈 등록" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={issueForm.title} onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={issueForm.severity} onChange={e => setIssueForm(f => ({ ...f, severity: e.target.value }))}>
              {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">재현 단계</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} value={issueForm.stepsToReproduce} onChange={e => setIssueForm(f => ({ ...f, stepsToReproduce: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기대 결과</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={issueForm.expectedResult} onChange={e => setIssueForm(f => ({ ...f, expectedResult: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">실제 결과</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={issueForm.actualResult} onChange={e => setIssueForm(f => ({ ...f, actualResult: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIssueModal(false)}>취소</Button>
            <Button onClick={handleCreateIssue} disabled={!issueForm.title.trim()}>이슈 등록</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
