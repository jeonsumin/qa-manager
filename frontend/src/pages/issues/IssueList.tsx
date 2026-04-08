import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useIssueStore} from '../../store/issueStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SidePanel from '../../components/ui/SidePanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import {SEVERITY_OPTIONS, ISSUE_STATUS_OPTIONS} from '../../utils/constants';
import {formatDate} from '../../utils/formatDate';
import type {Issue} from '../../types/issue';

export default function IssueList() {
    const {projectId} = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const {issues, loading, fetchIssues, createIssue, updateIssue, deleteIssue} = useIssueStore();
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('');
    const [severity, setSeverity] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Issue | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null);
    const [form, setForm] = useState({
        title: '',
        severity: 'minor',
        status: 'open',
        description: '',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        assignee: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchIssues(pid, {keyword, status, severity});
    }, [pid, keyword, status, severity]);

    const openCreate = () => {
        setEditTarget(null);
        setForm({
            title: '',
            severity: 'minor',
            status: 'open',
            description: '',
            stepsToReproduce: '',
            expectedResult: '',
            actualResult: '',
            assignee: ''
        });
        setPanelOpen(true);
    };
    const openEdit = (issue: Issue) => {
        setEditTarget(issue);
        setForm({
            title: issue.title,
            severity: issue.severity,
            status: issue.status,
            description: issue.description || '',
            stepsToReproduce: issue.stepsToReproduce || '',
            expectedResult: issue.expectedResult || '',
            actualResult: issue.actualResult || '',
            assignee: issue.assignee || ''
        });
        setPanelOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            if (editTarget) await updateIssue(pid, editTarget.id, form as Partial<Issue>);
            else await createIssue(pid, form as Partial<Issue>);
            setPanelOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const tf = (label: string, key: keyof typeof form, type: 'input' | 'textarea' | 'select' = 'input', options?: {
        value: string;
        label: string
    }[]) => {
        const fieldId = `issue-field-${key}`;
        return (
        <div>
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    id={fieldId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}/>
            ) : type === 'select' ? (
                <select
                    id={fieldId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}>
                    {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            ) : (
                <input
                    id={fieldId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}/>
            )}
        </div>
        );
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold text-gray-900">이슈</h1>
                <Button onClick={openCreate}>+ 새 이슈</Button>
            </div>

            <div className="flex gap-3 mb-4 flex-wrap">
                <SearchInput value={keyword} onChange={setKeyword} placeholder="이슈 검색"/>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">전체 상태</option>
                    {ISSUE_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="">전체 심각도</option>
                    {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                {loading ? <div className="py-16 text-center text-gray-400">로딩 중...</div>
                    : issues.length === 0 ? <EmptyState message="이슈가 없습니다."/>
                        : (
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b bg-gray-50 text-gray-500 text-left">
                                    <th className="px-5 py-3 font-medium">제목</th>
                                    <th className="px-5 py-3 font-medium">심각도</th>
                                    <th className="px-5 py-3 font-medium">상태</th>
                                    <th className="px-5 py-3 font-medium">담당자</th>
                                    <th className="px-5 py-3 font-medium">등록일</th>
                                    <th className="px-5 py-3 font-medium w-20">액션</th>
                                </tr>
                                </thead>
                                <tbody>
                                {issues.map(i => (
                                    <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-5 py-3 font-medium">{i.title}</td>
                                        <td className="px-5 py-3"><Badge value={i.severity}/></td>
                                        <td className="px-5 py-3"><Badge value={i.status}/></td>
                                        <td className="px-5 py-3 text-gray-500">{i.assignee || '-'}</td>
                                        <td className="px-5 py-3 text-gray-500">{formatDate(i.createdAt)}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(i)}
                                                        className="text-blue-600 hover:underline text-xs">편집
                                                </button>
                                                <button onClick={() => setDeleteTarget(i)}
                                                        className="text-red-600 hover:underline text-xs">삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
            </div>

            <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title={editTarget ? '이슈 수정' : '새 이슈'}>
                <div className="space-y-4">
                    {tf('제목 *', 'title')}
                    {tf('심각도', 'severity', 'select', SEVERITY_OPTIONS)}
                    {tf('상태', 'status', 'select', ISSUE_STATUS_OPTIONS)}
                    {tf('담당자', 'assignee')}
                    {tf('설명', 'description', 'textarea')}
                    {tf('재현 단계', 'stepsToReproduce', 'textarea')}
                    {tf('기대 결과', 'expectedResult', 'textarea')}
                    {tf('실제 결과', 'actualResult', 'textarea')}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setPanelOpen(false)}>취소</Button>
                        <Button onClick={handleSave}
                                disabled={saving || !form.title.trim()}>{saving ? '저장 중...' : '저장'}</Button>
                    </div>
                </div>
            </SidePanel>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    await deleteIssue(pid, deleteTarget!.id);
                    setDeleteTarget(null);
                }}
                title="이슈 삭제"
                message={`"${deleteTarget?.title}"을(를) 삭제하시겠습니까?`}
            />
        </div>
    );
}
