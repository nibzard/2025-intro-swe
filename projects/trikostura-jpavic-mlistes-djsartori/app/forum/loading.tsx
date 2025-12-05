import { CategorySkeleton, TopicSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function ForumLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 md:p-12">
        <Skeleton className="h-12 w-2/3 mb-4" />
        <Skeleton className="h-6 w-1/2" />
      </div>

      {/* Categories skeleton */}
      <div className="grid gap-6">
        <CategorySkeleton />
        <CategorySkeleton />
        <CategorySkeleton />
        <CategorySkeleton />
      </div>

      {/* Recent topics skeleton */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <TopicSkeleton />
          <TopicSkeleton />
          <TopicSkeleton />
          <TopicSkeleton />
          <TopicSkeleton />
        </div>
      </div>
    </div>
  );
}
