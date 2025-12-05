import { ReplySkeleton, Skeleton } from '@/components/ui/skeleton';

export default function TopicLoading() {
  return (
    <div className="space-y-6">
      {/* Back button skeleton */}
      <Skeleton className="h-12 w-48 rounded-xl" />

      {/* Main topic card skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-8">
        <div className="space-y-6">
          {/* Topic header */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-28 h-10 rounded-xl" />
          </div>

          {/* Topic title */}
          <Skeleton className="h-14 w-3/4" />

          {/* Meta info */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-48 h-6" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="w-32 h-10 rounded-xl" />
              <Skeleton className="w-32 h-10 rounded-xl" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>

      {/* Replies skeleton */}
      <div className="space-y-4">
        <ReplySkeleton />
        <ReplySkeleton />
        <ReplySkeleton />
      </div>
    </div>
  );
}
