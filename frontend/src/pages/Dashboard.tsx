import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useDashboardStore} from '../store/dashboardStore';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import {formatDate} from '../utils/formatDate';

export default function Dashboard() {
    const {overallData, loading, fetchOverall} = useDashboardStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchOverall();
    }, [fetchOverall]);

    const data = overallData as {
        summary: { totalProjects: number; activeProjects: number; totalOpenIssues: number; overallPassRate: number };
        projects: {
            id: number;
            name: string;
            status: string;
            totalCases: number;
            passCount: number;
            passRate: number;
            openIssueCount: number
        }[];
        recentTestRuns: {
            id: number;
            projectId: number;
            projectName: string;
            name: string;
            status: string;
            passRate: number;
            createdAt: string
        }[];
    } | null;

    if (loading && !data) return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

            <div className="grid grid-cols-4 gap-4">
                {[
                    {label: '전체 프로젝트', value: data?.summary.totalProjects ?? 0},
                    {label: '진행중 프로젝트', value: data?.summary.activeProjects ?? 0},
                    {label: '오픈 이슈', value: data?.summary.totalOpenIssues ?? 0},
                    {label: '전체 Pass율', value: `${data?.summary.overallPassRate ?? 0}%`},
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b">
                    <h2 className="font-semibold text-gray-900">프로젝트별 QA 현황</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 text-left">
                        <th className="px-5 py-3 font-medium">프로젝트</th>
                        <th className="px-5 py-3 font-medium">상태</th>
                        <th className="px-5 py-3 font-medium">케이스 수</th>
                        <th className="px-5 py-3 font-medium w-48">진행률</th>
                        <th className="px-5 py-3 font-medium">오픈 이슈</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(data?.projects ?? []).map(p => (
                        <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                            className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                            <td className="px-5 py-3 font-medium text-blue-600">{p.name}</td>
                            <td className="px-5 py-3"><Badge value={p.status}/></td>
                            <td className="px-5 py-3">{p.totalCases}</td>
                            <td className="px-5 py-3"><ProgressBar value={p.passRate} showLabel/></td>
                            <td className="px-5 py-3">{p.openIssueCount}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {!data?.projects?.length && <p className="text-center py-8 text-gray-400 text-sm">프로젝트가 없습니다.</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b">
                    <h2 className="font-semibold text-gray-900">최근 테스트런</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b bg-gray-50 text-gray-500 text-left">
                        <th className="px-5 py-3 font-medium">프로젝트</th>
                        <th className="px-5 py-3 font-medium">테스트런</th>
                        <th className="px-5 py-3 font-medium">상태</th>
                        <th className="px-5 py-3 font-medium w-40">Pass율</th>
                        <th className="px-5 py-3 font-medium">생성일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(data?.recentTestRuns ?? []).map(r => (
                        <tr key={r.id} onClick={() => navigate(`/projects/${r.projectId}/test-runs/${r.id}`)}
                            className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                            <td className="px-5 py-3 text-gray-500">{r.projectName}</td>
                            <td className="px-5 py-3 font-medium text-blue-600">{r.name}</td>
                            <td className="px-5 py-3"><Badge value={r.status}/></td>
                            <td className="px-5 py-3"><ProgressBar value={r.passRate} showLabel color="bg-green-500"/>
                            </td>
                            <td className="px-5 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {!data?.recentTestRuns?.length && <p className="text-center py-8 text-gray-400 text-sm">테스트런이 없습니다.</p>}
            </div>
        </div>
    );
}
