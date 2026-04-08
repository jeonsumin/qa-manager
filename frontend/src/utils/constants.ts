export const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: '진행중' },
  { value: 'completed', label: '종료' },
  { value: 'on-hold', label: '보류' },
];

export const TEST_RUN_STATUS_OPTIONS = [
  { value: 'pending', label: '준비중' },
  { value: 'in-progress', label: '진행중' },
  { value: 'completed', label: '완료' },
];

export const RESULT_STATUS_OPTIONS = [
  { value: 'not-run', label: 'Not Run' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'blocked', label: 'Blocked' },
];

export const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'trivial', label: 'Trivial' },
];

export const ISSUE_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

export const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
};

export const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  blocked: 'bg-orange-100 text-orange-700',
  'not-run': 'bg-gray-100 text-gray-600',
};

export const ISSUE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  rejected: 'bg-gray-100 text-gray-500',
};

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
  trivial: 'bg-gray-100 text-gray-600',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  'on-hold': 'bg-gray-100 text-gray-600',
};
