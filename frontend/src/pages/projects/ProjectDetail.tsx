import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import {useDashboardStore} from '../../store/dashboardStore';
import {useProjectStore} from '../../store/projectStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const PIE_COLORS = {pass: '#22c55e', fail: '#ef4444', blocked: '#f97316', notRun: '#9ca3af'};

type ProjectData = {
    project: { id: number; name: string; status: string };
    testCaseStats: { total: number; pass: number; fail: number; blocked: number; notRun: number };
    issueStats: { open: number; inProgress: number; resolved: number; closed: number };
    recentTestRuns: { id: number; name: string; status: string; passRate: number }[];
    bugReportStats: { total: number; new: number; reviewed: number; converted: number };
    bugReportsByDate: { date: string; count: number }[];
};

export default function ProjectDetail() {
    const {projectId} = useParams<{ projectId: string }>();
    const {projectData, fetchProject} = useDashboardStore();
    const {deleteProject} = useProjectStore();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (projectId) fetchProject(Number(projectId));
    }, [projectId]);

    const data = projectData as ProjectData | null;

    const handleDelete = async () => {
        if (!data) return;
        setDeleting(true);
        try {
            await deleteProject(data.project.id);
            navigate('/projects');
        } finally {
            setDeleting(false);
        }
    };

    if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;

    const donutData = [
        {name: 'Pass', value: data.testCaseStats.pass, color: PIE_COLORS.pass},
        {name: 'Fail', value: data.testCaseStats.fail, color: PIE_COLORS.fail},
        {name: 'Blocked', value: data.testCaseStats.blocked, color: PIE_COLORS.blocked},
        {name: 'Not Run', value: data.testCaseStats.notRun, color: PIE_COLORS.notRun},
    ].filter(d => d.value > 0);

    // 최근 14일 날짜 배열 생성 후 데이터 매핑
    const dateMap = new Map((data.bugReportsByDate ?? []).map(d => [d.date, d.count]));
    const barData = Array.from({length: 14}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        return {date: label, count: dateMap.get(key) ?? 0};
    });

    const {bugReportStats: brs} = data;

    return (
        <div className="space-y-5">
            {/* 헤더 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{data.project.name}</h1>
                        <Badge value={data.project.status}/>
                    </div>
                    <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>프로젝트 삭제</Button>
                </div>
            </div>

            {/* 버그 리포트 통계 카드 */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                    <p className="text-3xl font-bold text-gray-900">{brs?.total ?? 0}</p>
                    <p className="text-sm text-gray-500 mt-1">전체 리포트</p>
                </div>
                <div className="bg-white rounded-xl border border-red-100 p-5 text-center">
                    <p className="text-3xl font-bold text-red-600">{brs?.new ?? 0}</p>
                    <p className="text-sm text-gray-500 mt-1">New</p>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-5 text-center">
                    <p className="text-3xl font-bold text-blue-600">{brs?.reviewed ?? 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Reviewed</p>
                </div>
                <div className="bg-white rounded-xl border border-green-100 p-5 text-center">
                    <p className="text-3xl font-bold text-green-600">{brs?.converted ?? 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Converted</p>
                </div>
            </div>

            {/* 수신일별 버그 리포트 차트 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4">수신일별 버그 리포트 (최근 14일)</h2>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{top: 4, right: 8, left: -20, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="date" tick={{fontSize: 11}} interval={1}/>
                        <YAxis allowDecimals={false} tick={{fontSize: 11}}/>
                        <Tooltip
                            formatter={(v: number) => [v, '리포트']}
                            labelFormatter={(l) => `날짜: ${l}`}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 테스트 결과 분포 (데이터 있을 때만) */}
            {donutData.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">테스트 결과 분포</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                 dataKey="value"
                                 label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {donutData.map(d => <Cell key={d.name} fill={d.color}/>)}
                            </Pie>
                            <Tooltip/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="프로젝트 삭제"
                message={`"${data.project.name}" 프로젝트를 삭제하면 모든 데이터가 삭제됩니다.`}
                loading={deleting}
            />
        </div>
    );
}
