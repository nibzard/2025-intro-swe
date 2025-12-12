import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                    <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
