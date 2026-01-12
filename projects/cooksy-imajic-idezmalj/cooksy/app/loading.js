export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-700 mb-4" />
      <p className="text-lg font-medium">Loading...</p>
    </div>
  );
}
