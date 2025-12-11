import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Flame } from 'lucide-react';

interface ActivityDay {
  date: string;
  count: number; // topics_count + replies_count
}

interface ActivityCalendarProps {
  activity: ActivityDay[];
  currentStreak: number;
  longestStreak: number;
}

export function ActivityCalendar({ activity, currentStreak, longestStreak }: ActivityCalendarProps) {
  // Generate last 365 days
  const generateDays = () => {
    const days: Array<{ date: Date; count: number }> = [];
    const today = new Date();

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const activityDay = activity.find(a => a.date === dateStr);

      days.push({
        date,
        count: activityDay?.count || 0,
      });
    }

    return days;
  };

  const days = generateDays();

  // Group by weeks
  const weeks: Array<Array<{ date: Date; count: number }>> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // Get color based on activity count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count < 3) return 'bg-green-200 dark:bg-green-900';
    if (count < 6) return 'bg-green-400 dark:bg-green-700';
    if (count < 10) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };

  const totalDays = activity.length;
  const totalActivity = activity.reduce((sum, day) => sum + day.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Aktivnost
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {currentStreak}
            </div>
            <div className="text-xs text-gray-500 mt-1">Trenutni niz</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{longestStreak}</div>
            <div className="text-xs text-gray-500 mt-1">Najduži niz</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalActivity}</div>
            <div className="text-xs text-gray-500 mt-1">Ukupno aktivnosti</div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm transition-all hover:scale-150 cursor-pointer
                          ${getColor(day.count)}
                          ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                        `}
                        title={`${day.date.toLocaleDateString('hr-HR')}: ${day.count} aktivnosti`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <span>Manje</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
                <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-300" />
              </div>
              <span>Više</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
