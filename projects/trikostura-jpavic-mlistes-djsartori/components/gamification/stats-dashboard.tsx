import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, MessageSquare, Eye, ThumbsUp, Target } from 'lucide-react';

interface StatsData {
  totalTopics: number;
  totalReplies: number;
  totalViews: number;
  totalUpvotes: number;
  solutionsMarked: number;
  topicsByCategory: Array<{ category: string; count: number; color: string }>;
}

export function StatsDashboard({ stats }: { stats: StatsData }) {
  const maxCategoryCount = Math.max(...stats.topicsByCategory.map(c => c.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Statistika
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl font-bold">{stats.totalTopics}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Teme</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-bold">{stats.totalReplies}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Odgovori</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <Eye className="w-6 h-6 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pregledi</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <div className="text-2xl font-bold">{stats.totalUpvotes}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upvotes</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
            <Target className="w-6 h-6 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
            <div className="text-2xl font-bold">{stats.solutionsMarked}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Rješenja</div>
          </div>
        </div>

        {/* Topics by Category */}
        {stats.topicsByCategory.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Teme po kategorijama
            </h3>
            <div className="space-y-2">
              {stats.topicsByCategory.map((cat, idx) => {
                const percentage = (cat.count / maxCategoryCount) * 100;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{cat.category}</span>
                      <span className="font-semibold">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color || '#3B82F6',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
