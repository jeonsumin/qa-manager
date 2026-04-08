import db from '../db/database';

export const dashboardModel = {
  getOverallStats() {
    const projects = db.prepare(`
      SELECT id, name, status,
        (SELECT COUNT(*) FROM test_cases WHERE project_id = p.id) as total_cases,
        (SELECT COUNT(*) FROM issues WHERE project_id = p.id AND status = 'open') as open_issues
      FROM projects p
      ORDER BY created_at DESC
    `).all() as { id: number; name: string; status: string; total_cases: number; open_issues: number }[];

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalOpenIssues = projects.reduce((sum, p) => sum + p.open_issues, 0);

    const passStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as pass_count
      FROM test_run_results
    `).get() as { total: number; pass_count: number };

    const overallPassRate = passStats.total > 0
      ? Math.round((passStats.pass_count / passStats.total) * 100 * 10) / 10
      : 0;

    const projectStats = projects.map(p => {
      const caseStats = db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'pass' THEN 1 ELSE 0 END) as pass,
          SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as fail,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN status = 'not-run' THEN 1 ELSE 0 END) as not_run
        FROM test_run_results trr
        JOIN test_runs tr ON trr.test_run_id = tr.id
        WHERE tr.project_id = ?
      `).get(p.id) as Record<string, number>;

      const passRate = p.total_cases > 0 ? Math.round(((caseStats.pass || 0) / p.total_cases) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        totalCases: p.total_cases,
        passCount: caseStats.pass || 0,
        failCount: caseStats.fail || 0,
        blockedCount: caseStats.blocked || 0,
        notRunCount: caseStats.not_run || 0,
        openIssueCount: p.open_issues,
        passRate,
      };
    });

    const recentTestRuns = db.prepare(`
      SELECT tr.id, tr.project_id, p.name as project_name, tr.name, tr.status, tr.created_at,
        (SELECT COUNT(*) FROM test_run_results WHERE test_run_id = tr.id) as total,
        (SELECT COUNT(*) FROM test_run_results WHERE test_run_id = tr.id AND status = 'pass') as pass_count
      FROM test_runs tr
      JOIN projects p ON tr.project_id = p.id
      ORDER BY tr.created_at DESC
      LIMIT 5
    `).all() as { id: number; project_id: number; project_name: string; name: string; status: string; created_at: string; total: number; pass_count: number }[];

    return {
      summary: { totalProjects, activeProjects, totalOpenIssues, overallPassRate },
      projects: projectStats,
      recentTestRuns: recentTestRuns.map(r => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        name: r.name,
        status: r.status,
        passRate: r.total > 0 ? Math.round((r.pass_count / r.total) * 100) : 0,
        createdAt: r.created_at,
      })),
    };
  },

  getProjectStats(projectId: number) {
    const project = db.prepare('SELECT id, name, status FROM projects WHERE id = ?').get(projectId) as { id: number; name: string; status: string } | undefined;
    if (!project) return null;

    const caseStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN r.status = 'pass' THEN 1 ELSE 0 END) as pass,
        SUM(CASE WHEN r.status = 'fail' THEN 1 ELSE 0 END) as fail,
        SUM(CASE WHEN r.status = 'blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN r.status = 'not-run' OR r.status IS NULL THEN 1 ELSE 0 END) as not_run
      FROM test_cases tc
      LEFT JOIN (
        SELECT test_case_id, trr.status FROM test_run_results trr
        JOIN test_runs tr ON trr.test_run_id = tr.id
        WHERE tr.project_id = ?
        ORDER BY trr.updated_at DESC
      ) r ON r.test_case_id = tc.id
      WHERE tc.project_id = ?
    `).get(projectId, projectId) as Record<string, number>;

    const issueStats = db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) as major,
        SUM(CASE WHEN severity = 'minor' THEN 1 ELSE 0 END) as minor,
        SUM(CASE WHEN severity = 'trivial' THEN 1 ELSE 0 END) as trivial
      FROM issues WHERE project_id = ?
    `).get(projectId) as Record<string, number>;

    const recentRuns = db.prepare(`
      SELECT tr.id, tr.name, tr.status, tr.created_at,
        (SELECT COUNT(*) FROM test_run_results WHERE test_run_id = tr.id) as total,
        (SELECT COUNT(*) FROM test_run_results WHERE test_run_id = tr.id AND status = 'pass') as pass_count
      FROM test_runs tr WHERE tr.project_id = ?
      ORDER BY tr.created_at DESC LIMIT 5
    `).all(projectId) as { id: number; name: string; status: string; created_at: string; total: number; pass_count: number }[];

    const bugStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_count,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count
      FROM bug_reports WHERE project_id = ?
    `).get(projectId) as Record<string, number>;

    const bugByDate = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM bug_reports
      WHERE project_id = ? AND created_at >= date('now', '-13 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all(projectId) as { date: string; count: number }[];

    return {
      project,
      testCaseStats: {
        total: caseStats.total || 0,
        pass: caseStats.pass || 0,
        fail: caseStats.fail || 0,
        blocked: caseStats.blocked || 0,
        notRun: caseStats.not_run || 0,
      },
      issueStats: {
        open: issueStats.open || 0,
        inProgress: issueStats.in_progress || 0,
        resolved: issueStats.resolved || 0,
        closed: issueStats.closed || 0,
        rejected: issueStats.rejected || 0,
        bySeverity: {
          critical: issueStats.critical || 0,
          major: issueStats.major || 0,
          minor: issueStats.minor || 0,
          trivial: issueStats.trivial || 0,
        },
      },
      recentTestRuns: recentRuns.map(r => ({
        id: r.id, name: r.name, status: r.status, createdAt: r.created_at,
        passRate: r.total > 0 ? Math.round((r.pass_count / r.total) * 100) : 0,
      })),
      bugReportStats: {
        total: bugStats.total || 0,
        new: bugStats.new_count || 0,
        reviewed: bugStats.reviewed_count || 0,
        converted: bugStats.converted_count || 0,
      },
      bugReportsByDate: bugByDate,
    };
  },
};
