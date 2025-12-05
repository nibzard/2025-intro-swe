import { TopicSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <div className="space-y-8">
      {/* Category header skeleton */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <Skeleton className="w-32 h-12 rounded-xl" />
        </div>
      </div>

      {/* Topics list skeleton */}
      <div className="space-y-4">
        <TopicSkeleton />
        <TopicSkeleton />
        <TopicSkeleton />
        <TopicSkeleton />
        <TopicSkeleton />
        <TopicSkeleton />
      </div>
    </div>
  );
}
