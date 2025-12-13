/**
 * Achievement Actions - Server Actions
 * Server-side API for checking and awarding achievements
 */

'use server';

import { checkAndAwardAchievements as serverCheckAndAwardAchievements } from '@/lib/achievements';

export async function checkAndAwardAchievements(userId: string) {
  return serverCheckAndAwardAchievements(userId);
}
