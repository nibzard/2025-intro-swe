export default function ForumLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border rounded-lg p-6 bg-white dark:bg-gray-800 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
