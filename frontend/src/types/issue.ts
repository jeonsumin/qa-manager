export type Severity = 'critical' | 'major' | 'minor' | 'trivial';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  severity: Severity;
  status: IssueStatus;
  description: string | null;
  stepsToReproduce: string | null;
  expectedResult: string | null;
  actualResult: string | null;
  assignee: string | null;
  testCaseId: number | null;
  testRunResultId: number | null;
  createdAt: string;
  updatedAt: string;
  testCase?: { id: number; title: string; category: string | null; priority: string } | null;
}
