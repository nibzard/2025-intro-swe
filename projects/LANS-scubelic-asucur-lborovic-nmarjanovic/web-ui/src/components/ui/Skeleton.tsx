interface SkeletonProps {
  className?: string;
  theme?: string;
}

export function Skeleton({ className, theme = 'dark' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md ${
        theme === 'dark' ? 'bg-navy-800/50' : 'bg-gray-200'
      } ${className}`}
    />
  );
}
