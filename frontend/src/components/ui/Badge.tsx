import { PRIORITY_COLORS, RESULT_COLORS, ISSUE_STATUS_COLORS, SEVERITY_COLORS, PROJECT_STATUS_COLORS } from '../../utils/constants';

const ALL_COLORS: Record<string, string> = {
  ...PRIORITY_COLORS,
  ...RESULT_COLORS,
  ...ISSUE_STATUS_COLORS,
  ...SEVERITY_COLORS,
  ...PROJECT_STATUS_COLORS,
};

const LABELS: Record<string, string> = {
  active: '진행중', completed: '종료', 'on-hold': '보류',
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
  pass: 'Pass', fail: 'Fail', blocked: 'Blocked', 'not-run': 'Not Run',
  open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved', closed: 'Closed', rejected: 'Rejected',
  major: 'Major', minor: 'Minor', trivial: 'Trivial',
  pending: '준비중',
};

interface BadgeProps {
  value: string;
  label?: string;
}

export default function Badge({ value, label }: BadgeProps) {
  const color = ALL_COLORS[value] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label ?? LABELS[value] ?? value}
    </span>
  );
}
