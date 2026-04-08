import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {useTestCaseStore} from '../../store/testCaseStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SidePanel from '../../components/ui/SidePanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import {PRIORITY_OPTIONS} from '../../utils/constants';
import type {TestCase} from '../../types/testCase';

export default function TestCaseList() {
    const {projectId} = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const {
        cases,
        categories,
        loading,
        fetchCases,
        fetchCategories,
        createCase,
        updateCase,
        deleteCase
    } = useTestCaseStore();
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<TestCase | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null);
    const [form, setForm] = useState({
        title: '',
        category: '',
        priority: 'medium',
        precondition: '',
        steps: '',
        expectedResult: '',
        description: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCases(pid, {keyword, category, priority});
    }, [pid, keyword, category, priority]);
    useEffect(() => {
        fetchCategories(pid);
    }, [pid]);

    const openCreate = () => {
        setEditTarget(null);
        setForm({
            title: '',
            category: '',
            priority: 'medium',
            precondition: '',
            steps: '',
            expectedResult: '',
            description: ''
        });
        setPanelOpen(true);
    };
    const openEdit = (tc: TestCase) => {
        setEditTarget(tc);
        setForm({
            title: tc.title,
            category: tc.category || '',
            priority: tc.priority,
            precondition: tc.precondition || '',
            steps: tc.steps || '',
            expectedResult: tc.expectedResult || '',
            description: tc.description || ''
        });
        setPanelOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        setSaving(true);
        try {
            if (editTarget) await updateCase(pid, editTarget.id, form as Partial<TestCase>);
            else await createCase(pid, form as Partial<TestCase>);
            setPanelOpen(false);
        } finally {
            setSaving(false);
        }
    };

    const formField = (label: string, key: keyof typeof form, type: 'input' | 'textarea' | 'select' = 'input', options?: {
        value: string;
        label: string
    }[]) => {
        const fieldId = `tc-field-${key}`;
        return (
        <div>
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {type === 'textarea' ? (
                <textarea
                    id={fieldId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}/>
            ) : type === 'select' ? (
                <select
                    id={fieldId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}>
                    <option value="">선택 안함</option>
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
                <h1 className="text-2xl font-bold text-gray-900">테스트 케이스</h1>
                <Button onClick={openCreate}>+ 새 테스트 케이스</Button>
            </div>

            <div className="flex gap-3 mb-4 flex-wrap">
                <SearchInput value={keyword} onChange={setKeyword} placeholder="제목 검색"/>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">전체 카테고리</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="">전체 우선순위</option>
                    {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                {loading ? (
                    <div className="py-16 text-center text-gray-400">로딩 중...</div>
                ) : cases.length === 0 ? (
                    <EmptyState message="테스트 케이스가 없습니다."/>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b bg-gray-50 text-gray-500 text-left">
                            <th className="px-5 py-3 font-medium">제목</th>
                            <th className="px-5 py-3 font-medium">카테고리</th>
                            <th className="px-5 py-3 font-medium">우선순위</th>
                            <th className="px-5 py-3 font-medium">마지막 결과</th>
                            <th className="px-5 py-3 font-medium w-24">액션</th>
                        </tr>
                        </thead>
                        <tbody>
                        {cases.map(tc => (
                            <tr key={tc.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="px-5 py-3 font-medium">{tc.title}</td>
                                <td className="px-5 py-3 text-gray-500">{tc.category || '-'}</td>
                                <td className="px-5 py-3"><Badge value={tc.priority}/></td>
                                <td className="px-5 py-3">{tc.lastResult ? <Badge value={tc.lastResult}/> :
                                    <span className="text-gray-400">-</span>}</td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(tc)}
                                                className="text-blue-600 hover:underline text-xs">편집
                                        </button>
                                        <button onClick={() => setDeleteTarget(tc)}
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

            <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)}
                       title={editTarget ? '테스트 케이스 수정' : '새 테스트 케이스'}>
                <div className="space-y-4">
                    {formField('제목 *', 'title')}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                        <input list="categories"
                               className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                               value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}/>
                        <datalist id="categories">{categories.map(c => <option key={c} value={c}/>)}</datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    {formField('사전 조건', 'precondition', 'textarea')}
                    {formField('테스트 단계', 'steps', 'textarea')}
                    {formField('기대 결과', 'expectedResult', 'textarea')}
                    {formField('설명', 'description', 'textarea')}
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
                    await deleteCase(pid, deleteTarget!.id);
                    setDeleteTarget(null);
                }}
                title="테스트 케이스 삭제"
                message={`"${deleteTarget?.title}"을(를) 삭제하시겠습니까?`}
            />
        </div>
    );
}
