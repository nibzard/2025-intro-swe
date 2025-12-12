export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-12 w-96 bg-white/50 dark:bg-gray-800/50 rounded-lg mx-auto" />
          <div className="h-8 w-64 bg-white/50 dark:bg-gray-800/50 rounded-lg mx-auto" />
        </div>
        <div className="flex gap-4 justify-center">
          <div className="h-12 w-40 bg-white/50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="h-12 w-32 bg-white/50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
