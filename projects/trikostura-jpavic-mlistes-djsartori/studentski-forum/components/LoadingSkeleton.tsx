export function CategorySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}

export function TopicSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="flex gap-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
      <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-3"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}
