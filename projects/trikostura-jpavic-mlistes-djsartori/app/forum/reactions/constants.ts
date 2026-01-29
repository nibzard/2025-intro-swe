/**
 * Available emoji reactions for topics and replies
 */
export const REACTION_EMOJIS = {
  THUMBS_UP: '👍',
  HEART: '❤️',
  LAUGH: '😂',
  TARGET: '🎯',
  FIRE: '🔥',
  CLAP: '👏',
} as const;

export type ReactionEmoji = typeof REACTION_EMOJIS[keyof typeof REACTION_EMOJIS];
