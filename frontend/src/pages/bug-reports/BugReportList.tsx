import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBugReportStore } from '../../store/bugReportStore';
import Button from '../../components/ui/Button';
import SidePanel from '../../components/ui/SidePanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatDate';
import type { BugReport, BugReportStatus } from '../../types/bugReport';

const STATUS_TABS: { value: BugReportStatus | ''; label: string }[] = [
    { value: '', label: '전체' },
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'converted', label: 'Converted' },
];

const STATUS_BADGE: Record<BugReportStatus, string> = {
    new: 'bg-red-100 text-red-700',
    reviewed: 'bg-blue-100 text-blue-700',
    converted: 'bg-green-100 text-green-700',
};

const STATUS_LABEL: Record<BugReportStatus, string> = {
    new: 'New',
    reviewed: 'Reviewed',
    converted: 'Converted',
};

function summarizeUserAgent(ua: string | undefined): string {
    if (!ua) return '-';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.slice(0, 30);
}

export default function BugReportList() {
    const { projectId } = useParams<{ projectId: string }>();
    const pid = Number(projectId);
    const {
        bugReports,
        loading,
        fetchBugReports,
        updateBugReport,
        convertToIssue,
        deleteBugReport
    } = useBugReportStore();

    const [statusFilter, setStatusFilter] = useState<BugReportStatus | ''>('');
    const [selected, setSelected] = useState<BugReport | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BugReport | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [sendingSample, setSendingSample] = useState(false);

    useEffect(() => {
        fetchBugReports(pid, statusFilter ? { status: statusFilter } : undefined);
    }, [pid, statusFilter]);

    const openDetail = (report: BugReport) => setSelected(report);
    const closeDetail = () => setSelected(null);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleConvert = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await convertToIssue(pid, selected.id);
            setSelected(s => s ? { ...s, status: 'converted' } : null);
            showSuccess('해결 완료로 처리되었습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReviewed = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            const updated = await updateBugReport(pid, selected.id, { status: 'reviewed' });
            setSelected(updated);
            showSuccess('작업 중로 변경되었습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteBugReport(pid, deleteTarget.id);
        setDeleteTarget(null);
        if (selected?.id === deleteTarget.id) closeDetail();
    };

    const sampleScreenshot = "data:image/gif;base64,R0lGODlhAAEAAcQAALe9v9ve3/b393mDiJScoO3u74KMkMnNz4uUmKatsOTm552kqK+1uNLW18DFx3B7gP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjAxODAxMTc0MDcyMDY4MTE5QjEwQjYyNTc4MkUxRURBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjEzN0VEMDZBQjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjEzN0VEMDY5QjMyNzExRTE4REMzRUZGMkFCOTM1NkZBIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUgTWFjaW50b3NoIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MDI4MDExNzQwNzIwNjgxMTlCMTBCNjI1NzgyRTFFREEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MDE4MDExNzQwNzIwNjgxMTlCMTBCNjI1Nzgy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";

    const handleSendSample = async () => {
        setSendingSample(true);
        try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/report-bug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: pid,
                    sessionId: 'sample-session-001',
                    title: '[샘플] 버튼 클릭 시 500 에러 발생',
                    description: '결제 버튼을 클릭했을 때 화면이 멈추고 콘솔에 TypeError가 출력됩니다.\n재현 방법:\n1. 장바구니에 상품 담기\n2. 결제하기 버튼 클릭\n3. 즉시 에러 발생',
                    screenshot: sampleScreenshot,
                    lastError: {
                        message: "TypeError: Cannot read properties of undefined (reading 'price')",
                        stack: "TypeError: Cannot read properties of undefined (reading 'price')\n    at CartPage.handleCheckout (CartPage.tsx:42:18)\n    at HTMLButtonElement.onclick (index.html:1:1)",
                        type: 'TypeError',
                    },
                    breadcrumbs: [
                        { time: '2024-01-15T10:30:00.000Z', action: '페이지 진입: /cart' },
                        { time: '2024-01-15T10:30:05.000Z', action: '버튼 클릭: 결제하기' },
                        { time: '2024-01-15T10:30:06.000Z', action: 'API 호출: POST /api/checkout' },
                    ],
                    recentNetworks: [
                        { method: 'GET', url: '/api/cart/items', status: 200 },
                        { method: 'POST', url: '/api/checkout', status: 500 },
                    ],
                    env: {
                        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
                        url: 'http://localhost:5174/cart',
                        viewport: '1440x900',
                    },
                }),
            });
            showSuccess('샘플 버그 리포트가 전송되었습니다.');
            fetchBugReports(pid);
        } finally {
            setSendingSample(false);
        }
    };

    const stackLines = selected?.lastError?.stack?.split('\n').slice(0, 10).join('\n');

    return (
        <div>
            {successMsg && (
                <div
                    className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                    {successMsg}
                </div>
            )}

            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold text-gray-900">버그 리포트</h1>
                <Button variant="secondary" onClick={handleSendSample} disabled={sendingSample}>
                    {sendingSample ? '전송 중...' : '샘플 전송'}
                </Button>
            </div>

            <div className="flex gap-1 mb-4 border-b border-gray-200">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${statusFilter === tab.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                {loading ? (
                    <div className="py-16 text-center text-gray-400">로딩 중...</div>
                ) : bugReports.length === 0 ? (
                    <EmptyState message="버그 리포트가 없습니다." />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-500 text-left">
                                <th className="px-5 py-3 font-medium">제목 / 에러 메시지</th>
                                <th className="px-5 py-3 font-medium">발생 URL</th>
                                <th className="px-5 py-3 font-medium">상태</th>
                                <th className="px-5 py-3 font-medium">브라우저</th>
                                <th className="px-5 py-3 font-medium">수신일</th>
                                <th className="px-5 py-3 font-medium w-16">액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bugReports.map(r => (
                                <tr
                                    key={r.id}
                                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => openDetail(r)}
                                >
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-gray-900 truncate max-w-xs">
                                            {r.title || r.lastError?.message || '(제목 없음)'}
                                        </div>
                                        {r.title && r.lastError?.message && (
                                            <div
                                                className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{r.lastError.message}</div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 truncate max-w-xs">
                                        {r.env?.url || '-'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                                            {STATUS_LABEL[r.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500">{summarizeUserAgent(r.env?.userAgent)}</td>
                                    <td className="px-5 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setDeleteTarget(r);
                                            }}
                                            className="text-red-600 hover:underline text-xs"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <SidePanel isOpen={!!selected} onClose={closeDetail} title="버그 리포트 상세">
                {selected && (
                    <div className="space-y-5">
                        {selected.description && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">코멘트</div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                                    {selected.description}
                                </div>
                            </div>
                        )}

                        {selected.screenshot && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">스크린샷</div>
                                <img
                                    src={selected.screenshot}
                                    alt="screenshot"
                                    className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50"
                                />
                            </div>
                        )}

                        {selected.lastError && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">에러 정보</div>
                                <div
                                    className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">
                                    {selected.lastError.message}
                                </div>
                                {stackLines && (
                                    <pre
                                        className="mt-2 bg-gray-100 rounded-lg px-4 py-3 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                        {stackLines}
                                    </pre>
                                )}
                            </div>
                        )}

                        {selected.env && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">환경 정보</div>
                                <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100">
                                    <div className="px-4 py-2.5 flex gap-3 text-sm">
                                        <span className="text-gray-500 w-20 shrink-0">브라우저</span>
                                        <span className="text-gray-800 break-all">{selected.env.userAgent}</span>
                                    </div>
                                    <div className="px-4 py-2.5 flex gap-3 text-sm">
                                        <span className="text-gray-500 w-20 shrink-0">URL</span>
                                        <span className="text-gray-800 break-all">{selected.env.url}</span>
                                    </div>
                                    <div className="px-4 py-2.5 flex gap-3 text-sm">
                                        <span className="text-gray-500 w-20 shrink-0">뷰포트</span>
                                        <span className="text-gray-800">{selected.env.viewport}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selected.recentNetworks && selected.recentNetworks.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">네트워크 요청</div>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 border-b text-gray-500">
                                                <th className="px-3 py-2 text-left font-medium">메서드</th>
                                                <th className="px-3 py-2 text-left font-medium">상태</th>
                                                <th className="px-3 py-2 text-left font-medium">URL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.recentNetworks.map((n, i) => {
                                                const isError = n.status >= 400;
                                                return (
                                                    <tr key={i} className="border-b last:border-0">
                                                        <td className="px-3 py-2 font-mono text-gray-600">{n.method}</td>
                                                        <td className={`px-3 py-2 font-mono font-medium ${isError ? 'text-red-600' : 'text-gray-600'}`}>
                                                            {n.status}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 break-all">{n.url}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selected.breadcrumbs && selected.breadcrumbs.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-2">브레드크럼</div>
                                <ul className="space-y-1.5">
                                    {selected.breadcrumbs.map((b, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <span className="text-gray-400 text-xs mt-0.5 shrink-0">
                                                {new Date(b.time).toLocaleTimeString('ko-KR')}
                                            </span>
                                            <span className="text-gray-700">{b.action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {selected.status !== 'converted' && (
                                <Button onClick={handleConvert} disabled={actionLoading}>
                                    완료
                                </Button>
                            )}
                            {selected.status === 'new' && (
                                <Button variant="secondary" onClick={handleReviewed} disabled={actionLoading}>
                                    작업 중
                                </Button>
                            )}
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setDeleteTarget(selected);
                                    closeDetail();
                                }}
                                disabled={actionLoading}
                            >
                                삭제
                            </Button>
                        </div>
                    </div>
                )}
            </SidePanel>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="버그 리포트 삭제"
                message={`"${deleteTarget?.title || deleteTarget?.lastError?.message || '이 리포트'}"을(를) 삭제하시겠습니까?`}
            />


        </div>
    );
}
