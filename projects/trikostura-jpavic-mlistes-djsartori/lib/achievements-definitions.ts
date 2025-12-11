/**
 * Achievement Definitions
 * Client-safe achievement constants and types
 */

import {
  Trophy,
  MessageSquare,
  Eye,
  ThumbsUp,
  Flame,
  Star,
  Target,
  Award,
  BookOpen,
  Users,
  Zap,
  TrendingUp,
  Heart,
  Crown,
  Sparkles
} from 'lucide-react';

export type AchievementId =
  | 'first_topic'
  | 'first_reply'
  | 'topic_100_views'
  | 'topic_500_views'
  | '10_replies'
  | '50_replies'
  | '100_replies'
  | '10_upvotes'
  | '50_upvotes'
  | '7_day_streak'
  | '30_day_streak'
  | '10_solutions'
  | 'early_adopter'
  | 'helpful'
  | 'popular'
  | 'expert'
  | 'legend';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: any; // Lucide icon component
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  requirement: number;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  // Beginner achievements
  first_topic: {
    id: 'first_topic',
    name: 'Prvi korak',
    description: 'Objavio prvu temu',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-blue-400 to-blue-600',
    requirement: 1,
  },
  first_reply: {
    id: 'first_reply',
    name: 'Prvi odgovor',
    description: 'Objavio prvi odgovor',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-green-400 to-green-600',
    requirement: 1,
  },

  // View achievements
  topic_100_views: {
    id: 'topic_100_views',
    name: 'Popularan',
    description: 'Tema dosegla 100 pregleda',
    icon: Eye,
    rarity: 'rare',
    color: 'from-purple-400 to-purple-600',
    requirement: 100,
  },
  topic_500_views: {
    id: 'topic_500_views',
    name: 'Viral',
    description: 'Tema dosegla 500 pregleda',
    icon: TrendingUp,
    rarity: 'epic',
    color: 'from-pink-400 to-pink-600',
    requirement: 500,
  },

  // Reply achievements
  '10_replies': {
    id: '10_replies',
    name: 'Razgovorljiv',
    description: 'Objavio 10 odgovora',
    icon: MessageSquare,
    rarity: 'common',
    color: 'from-cyan-400 to-cyan-600',
    requirement: 10,
  },
  '50_replies': {
    id: '50_replies',
    name: 'Aktivan sugovornik',
    description: 'Objavio 50 odgovora',
    icon: Zap,
    rarity: 'rare',
    color: 'from-orange-400 to-orange-600',
    requirement: 50,
  },
  '100_replies': {
    id: '100_replies',
    name: 'Guru odgovora',
    description: 'Objavio 100 odgovora',
    icon: Crown,
    rarity: 'epic',
    color: 'from-yellow-400 to-yellow-600',
    requirement: 100,
  },

  // Upvote achievements
  '10_upvotes': {
    id: '10_upvotes',
    name: 'Cijenjen',
    description: 'Dobio 10 upvote-ova',
    icon: ThumbsUp,
    rarity: 'common',
    color: 'from-emerald-400 to-emerald-600',
    requirement: 10,
  },
  '50_upvotes': {
    id: '50_upvotes',
    name: 'Vrlo cijenjen',
    description: 'Dobio 50 upvote-ova',
    icon: Heart,
    rarity: 'rare',
    color: 'from-red-400 to-red-600',
    requirement: 50,
  },

  // Streak achievements
  '7_day_streak': {
    id: '7_day_streak',
    name: 'Posvećen',
    description: '7 dana uzastopnog aktivnosti',
    icon: Flame,
    rarity: 'rare',
    color: 'from-orange-500 to-red-500',
    requirement: 7,
  },
  '30_day_streak': {
    id: '30_day_streak',
    name: 'Nepokolebljiv',
    description: '30 dana uzastopnog aktivnosti',
    icon: Flame,
    rarity: 'legendary',
    color: 'from-red-500 to-yellow-500',
    requirement: 30,
  },

  // Solution achievements
  '10_solutions': {
    id: '10_solutions',
    name: 'Rješavač problema',
    description: '10 označenih rješenja',
    icon: Target,
    rarity: 'epic',
    color: 'from-indigo-400 to-indigo-600',
    requirement: 10,
  },

  // Special achievements
  early_adopter: {
    id: 'early_adopter',
    name: 'Rani korisnik',
    description: 'Među prvim članovima zajednice',
    icon: Star,
    rarity: 'legendary',
    color: 'from-purple-500 to-pink-500',
    requirement: 1,
  },
  helpful: {
    id: 'helpful',
    name: 'Pomoćna ruka',
    description: '90%+ korisnih odgovora',
    icon: Users,
    rarity: 'epic',
    color: 'from-teal-400 to-teal-600',
    requirement: 90,
  },
  popular: {
    id: 'popular',
    name: 'Zvijezda zajednice',
    description: '1000+ ukupnih pregleda',
    icon: Sparkles,
    rarity: 'epic',
    color: 'from-violet-400 to-violet-600',
    requirement: 1000,
  },
  expert: {
    id: 'expert',
    name: 'Stručnjak',
    description: '500+ reputacije',
    icon: Award,
    rarity: 'epic',
    color: 'from-blue-500 to-purple-500',
    requirement: 500,
  },
  legend: {
    id: 'legend',
    name: 'Legenda',
    description: '1000+ reputacije',
    icon: Trophy,
    rarity: 'legendary',
    color: 'from-yellow-500 to-orange-500',
    requirement: 1000,
  },
};

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common': return 'text-gray-600 dark:text-gray-400';
    case 'rare': return 'text-blue-600 dark:text-blue-400';
    case 'epic': return 'text-purple-600 dark:text-purple-400';
    case 'legendary': return 'text-yellow-600 dark:text-yellow-400';
  }
}
