import { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';

export default function Sidebar() {
  const { projects, fetchProjects } = useProjectStore();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => {
    if (projectId) setExpanded(Number(projectId));
  }, [projectId]);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-1.5 rounded text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed top-0 left-0">
      <div className="px-4 py-5 border-b">
        <NavLink to="/" className="text-lg font-bold text-blue-600">QA Manager</NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <NavLink to="/" end className={navCls}>대시보드</NavLink>
        <div className="mt-4 mb-1 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">프로젝트</div>
        {projects.map(p => (
          <div key={p.id}>
            <button
              onClick={() => { setExpanded(expanded === p.id ? null : p.id); navigate(`/projects/${p.id}`); }}
              className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded text-sm font-medium transition-colors ${Number(projectId) === p.id ? 'text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <span className="truncate">{p.name}</span>
              <svg className={`w-3 h-3 transition-transform ${expanded === p.id ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {expanded === p.id && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <NavLink to={`/projects/${p.id}/bug-reports`} className={navCls}>버그 리포트</NavLink>
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t">
        <NavLink to="/projects" className="block text-center text-sm text-blue-600 hover:text-blue-700 py-1.5 rounded hover:bg-blue-50">+ 프로젝트 관리</NavLink>
      </div>
    </aside>
  );
}
