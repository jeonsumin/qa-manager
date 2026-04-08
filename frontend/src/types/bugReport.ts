export type BugReportStatus = 'new' | 'reviewed' | 'converted';

export interface BugReport {
  id: number;
  projectId: number;
  sessionId: string | null;
  title: string | null;
  description: string | null;
  lastError: { message: string; stack?: string; type?: string } | null;
  breadcrumbs: { action: string; time: number }[] | null;
  recentNetworks: { url: string; method: string; status: number; duration?: number }[] | null;
  env: { userAgent: string; url: string; viewport: string } | null;
  screenshot: string | null;
  status: BugReportStatus;
  issueId: number | null;
  createdAt: string;
}
