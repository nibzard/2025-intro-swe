export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

export function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-6 flex-1">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-16 h-10 rounded-2xl" />
          <Skeleton className="w-12 h-4" />
        </div>
      </div>
    </div>
  );
}

export function TopicSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-28 h-4" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="w-16 h-8 rounded-2xl" />
          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    </div>
  );
}

export function ReplySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-16 h-10 rounded-lg" />
          <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-24 h-5 rounded-full" />
            <Skeleton className="w-40 h-5" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}
