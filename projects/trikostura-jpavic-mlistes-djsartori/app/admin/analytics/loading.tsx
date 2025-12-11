import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
        <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity list */}
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
