interface StatsBarProps {
  label: string;
  value: number;
  total: number;
  colorClass?: string;
  theme?: string;
  suffix?: string;
}

export function StatsBar({ label, value, total, colorClass = 'bg-primary-500', theme = 'dark', suffix = '' }: StatsBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / total) * 100)) || 0;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className={`${theme === 'dark' ? 'text-navy-300' : 'text-gray-600'}`}>{label}</span>
        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {value}{suffix}
        </span>
      </div>
      <div className={`h-2 w-full rounded-full ${theme === 'dark' ? 'bg-navy-800' : 'bg-gray-200'} overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
