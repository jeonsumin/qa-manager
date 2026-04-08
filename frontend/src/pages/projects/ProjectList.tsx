import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants';
import type { Project } from '../../types/project';

const STATUSES = [{ value: '', label: '전체' }, ...PROJECT_STATUS_OPTIONS];

export default function ProjectList() {
  const { projects, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProjects(statusFilter ? { status: statusFilter } : {}); }, [statusFilter]);

  const openCreate = () => { setEditTarget(null); setForm({ name: '', description: '', status: 'active', startDate: '', endDate: '' }); setModalOpen(true); };
  const openEdit = (p: Project, e: React.MouseEvent) => { e.stopPropagation(); setEditTarget(p); setForm({ name: p.name, description: p.description || '', status: p.status, startDate: p.startDate || '', endDate: p.endDate || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) await updateProject(editTarget.id, form as Parameters<typeof updateProject>[1]);
      else await createProject(form as Parameters<typeof createProject>[0]);
      setModalOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await deleteProject(deleteTarget.id); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const passRate = (p: Project) => p.stats.totalCases > 0 ? Math.round(((p.stats.passCount) / p.stats.totalCases) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">프로젝트</h1>
        <Button onClick={openCreate}>+ 새 프로젝트</Button>
      </div>

      <div className="flex gap-2 mb-5">
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s.value ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {projects.map(p => (
          <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate flex-1 pr-2">{p.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => openEdit(p, e)} className="p-1 text-gray-400 hover:text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                {p.status === 'active' && (
                  <button title="종료" onClick={e => { e.stopPropagation(); updateProject(p.id, { status: 'completed' }); }} className="p-1 text-gray-400 hover:text-orange-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" /></svg>
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(p); }} className="p-1 text-gray-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            <Badge value={p.status} />
            {p.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>}
            <div className="mt-3"><ProgressBar value={passRate(p)} showLabel /></div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span>케이스 {p.stats.totalCases}</span>
              <span>이슈 {p.stats.openIssueCount}</span>
            </div>
          </div>
        ))}
      </div>
      {!projects.length && <p className="text-center py-16 text-gray-400">프로젝트가 없습니다.</p>}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? '프로젝트 수정' : '새 프로젝트'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">프로젝트명 *</label>
            <input id="project-name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea id="project-description" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="project-status" className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select id="project-status" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {PROJECT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-start-date" className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input id="project-start-date" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="project-end-date" className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input id="project-end-date" type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? '저장 중...' : '저장'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="프로젝트 삭제"
        message={`"${deleteTarget?.name}" 프로젝트를 삭제하면 모든 테스트 케이스, 테스트런, 이슈가 함께 삭제됩니다.`}
        loading={deleting}
      />
    </div>
  );
}
