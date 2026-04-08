export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface TestCase {
  id: number;
  projectId: number;
  title: string;
  category: string | null;
  priority: Priority;
  precondition: string | null;
  steps: string | null;
  expectedResult: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastResult?: string | null;
  executionHistory?: { status: string; updatedAt: string; runName: string; runId: number }[];
}
