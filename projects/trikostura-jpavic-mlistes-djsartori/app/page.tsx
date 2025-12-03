import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Studentski Forum
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
            Hrvatski Online Forum za Studente
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/forum"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Istraži Forum
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            Prijavi se
          </Link>
        </div>

        <div className="pt-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            Pridruži se zajednici studenata iz cijele Hrvatske
          </p>
        </div>
      </div>
    </div>
  );
}
