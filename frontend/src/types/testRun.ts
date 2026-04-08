export type ResultStatus = 'not-run' | 'pass' | 'fail' | 'blocked';
export type TestRunStatus = 'pending' | 'in-progress' | 'completed';

export interface TestRunStats {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  notRun: number;
}

export interface TestRunResult {
  id: number;
  testCaseId: number;
  status: ResultStatus;
  comment: string | null;
  updatedAt: string;
  testCase: {
    id: number;
    title: string;
    category: string | null;
    priority: string;
    steps: string | null;
    expectedResult: string | null;
    precondition: string | null;
  };
}

export interface TestRun {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  environment: string | null;
  status: TestRunStatus;
  createdAt: string;
  updatedAt: string;
  stats: TestRunStats;
  results?: TestRunResult[];
}
