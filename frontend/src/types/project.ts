export type ProjectStatus = 'active' | 'completed' | 'on-hold';

export interface ProjectStats {
  totalCases: number;
  passCount: number;
  failCount: number;
  blockedCount: number;
  notRunCount: number;
  openIssueCount: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  stats: ProjectStats;
}
