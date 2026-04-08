interface ProgressBarProps {
  value: number;
  color?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ value, color = 'bg-blue-500', showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}
