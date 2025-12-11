import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ACHIEVEMENTS, type Achievement, getRarityColor } from '@/lib/achievements';
import { Award, Lock } from 'lucide-react';

interface BadgeShowcaseProps {
  achievements: Array<Achievement & { earnedAt: string }>;
  totalAchievements?: number;
}

export function BadgeShowcaseComponent({ achievements, totalAchievements = Object.keys(ACHIEVEMENTS).length }: BadgeShowcaseProps) {
  const earnedIds = new Set(achievements.map(a => a.id));
  const allAchievements = Object.values(ACHIEVEMENTS);

  // Group by rarity
  const byRarity = {
    legendary: allAchievements.filter(a => a.rarity === 'legendary'),
    epic: allAchievements.filter(a => a.rarity === 'epic'),
    rare: allAchievements.filter(a => a.rarity === 'rare'),
    common: allAchievements.filter(a => a.rarity === 'common'),
  };

  const completionRate = Math.round((achievements.length / totalAchievements) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Postignuća
          </CardTitle>
          <div className="text-sm text-gray-500">
            {achievements.length} / {totalAchievements} ({completionRate}%)
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Ukupan napredak</span>
            <span className="font-semibold">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Achievements by rarity */}
        {Object.entries(byRarity).map(([rarity, badges]) => {
          const rarityLabel = {
            legendary: 'Legendarne',
            epic: 'Epske',
            rare: 'Rijetke',
            common: 'Obične',
          }[rarity as keyof typeof byRarity];

          const rarityColor = getRarityColor(rarity as Achievement['rarity']);

          return (
            <div key={rarity} className="space-y-3">
              <h3 className={`text-sm font-semibold ${rarityColor}`}>
                {rarityLabel}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.map(badge => {
                  const earned = earnedIds.has(badge.id);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={badge.id}
                      className={`
                        group relative p-4 rounded-lg border-2 transition-all
                        ${earned
                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-lg cursor-pointer'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50'
                        }
                      `}
                      title={earned ? `Zarađeno: ${new Date(achievements.find(a => a.id === badge.id)?.earnedAt || '').toLocaleDateString('hr-HR')}` : 'Još nije zarađeno'}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        {earned ? (
                          <div className={`p-3 rounded-full bg-gradient-to-br ${badge.color}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        ) : (
                          <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-700">
                            <Lock className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <div className={`text-xs font-semibold ${earned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            {badge.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {badge.description}
                          </div>
                        </div>
                      </div>

                      {/* Hover tooltip */}
                      {earned && (
                        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center p-2">
                            <div className="text-xs font-semibold mb-1">{badge.name}</div>
                            <div className="text-xs opacity-90">{badge.description}</div>
                            <div className="text-xs mt-2 opacity-75">
                              {new Date(achievements.find(a => a.id === badge.id)?.earnedAt || '').toLocaleDateString('hr-HR')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
