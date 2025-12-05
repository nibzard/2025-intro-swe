export default function TopicLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
      </div>

      <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 animate-pulse space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-lg p-6 bg-white dark:bg-gray-800 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
