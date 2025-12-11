/**
 * Spam Detection Utilities
 * Simple but effective spam detection for user-generated content
 */

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Check if content is likely spam
 */
export function detectSpam(content: string): SpamCheckResult {
  const trimmedContent = content.trim();

  // Check 1: Excessive links (more than 5 links)
  const linkCount = (trimmedContent.match(/https?:\/\//gi) || []).length;
  if (linkCount > 5) {
    return {
      isSpam: true,
      reason: 'Previše linkova u sadržaju',
      confidence: 'high',
    };
  }

  // Check 2: Excessive capitalization (>70% uppercase)
  const upperCaseRatio = calculateUpperCaseRatio(trimmedContent);
  if (upperCaseRatio > 0.7 && trimmedContent.length > 20) {
    return {
      isSpam: true,
      reason: 'Previše velikih slova',
      confidence: 'medium',
    };
  }

  // Check 3: Repeated characters (e.g., "aaaaaaaa", "!!!!!!!!")
  if (/(.)\1{9,}/.test(trimmedContent)) {
    return {
      isSpam: true,
      reason: 'Ponavljanje istih znakova',
      confidence: 'high',
    };
  }

  // Check 4: Common spam keywords
  const spamKeywords = [
    'buy now',
    'click here',
    'earn money fast',
    'work from home',
    'limited time offer',
    'act now',
    'free money',
    'winner',
    'congratulations you won',
    'viagra',
    'cialis',
    'casino',
    'lottery',
  ];

  const lowerContent = trimmedContent.toLowerCase();
  const spamKeywordCount = spamKeywords.filter(keyword =>
    lowerContent.includes(keyword)
  ).length;

  if (spamKeywordCount >= 2) {
    return {
      isSpam: true,
      reason: 'Detektirane spam ključne riječi',
      confidence: 'high',
    };
  }

  // Check 5: Excessive emoji usage (>30% of content)
  const emojiRatio = calculateEmojiRatio(trimmedContent);
  if (emojiRatio > 0.3 && trimmedContent.length > 20) {
    return {
      isSpam: true,
      reason: 'Previše emoji simbola',
      confidence: 'low',
    };
  }

  // Check 6: Very short repetitive content
  if (trimmedContent.length < 10 && /^(.+)\1{2,}$/.test(trimmedContent)) {
    return {
      isSpam: true,
      reason: 'Ponavljajući kratak sadržaj',
      confidence: 'medium',
    };
  }

  return {
    isSpam: false,
    confidence: 'low',
  };
}

/**
 * Check for duplicate content from same user
 */
export interface DuplicateCheckParams {
  content: string;
  userId: string;
  recentPosts: Array<{ content: string; created_at: string }>;
  timeWindowMinutes?: number;
}

export function detectDuplicate({
  content,
  userId,
  recentPosts,
  timeWindowMinutes = 5,
}: DuplicateCheckParams): SpamCheckResult {
  const now = new Date();
  const timeWindow = timeWindowMinutes * 60 * 1000;

  // Check for exact duplicates within time window
  for (const post of recentPosts) {
    const postTime = new Date(post.created_at);
    const timeDiff = now.getTime() - postTime.getTime();

    if (timeDiff < timeWindow) {
      // Check for exact match
      if (post.content.trim() === content.trim()) {
        return {
          isSpam: true,
          reason: 'Isti sadržaj već objavljen',
          confidence: 'high',
        };
      }

      // Check for very similar content (>90% similarity)
      const similarity = calculateSimilarity(post.content, content);
      if (similarity > 0.9) {
        return {
          isSpam: true,
          reason: 'Vrlo sličan sadržaj već objavljen',
          confidence: 'high',
        };
      }
    }
  }

  return {
    isSpam: false,
    confidence: 'low',
  };
}

/**
 * Check for rapid posting (spam behavior)
 */
export interface RateLimitParams {
  userId: string;
  recentPosts: Array<{ created_at: string }>;
  maxPostsPerMinute?: number;
}

export function detectRapidPosting({
  userId,
  recentPosts,
  maxPostsPerMinute = 3,
}: RateLimitParams): SpamCheckResult {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const recentCount = recentPosts.filter(post => {
    const postTime = new Date(post.created_at);
    return postTime > oneMinuteAgo;
  }).length;

  if (recentCount >= maxPostsPerMinute) {
    return {
      isSpam: true,
      reason: `Previše objava u kratkom vremenu (${recentCount} objava u 1 minuti)`,
      confidence: 'high',
    };
  }

  return {
    isSpam: false,
    confidence: 'low',
  };
}

/**
 * Comprehensive spam check combining all methods
 */
export async function comprehensiveSpamCheck(params: {
  content: string;
  userId: string;
  recentPosts: Array<{ content: string; created_at: string }>;
}): Promise<SpamCheckResult> {
  // Check 1: Content-based spam detection
  const contentCheck = detectSpam(params.content);
  if (contentCheck.isSpam) {
    return contentCheck;
  }

  // Check 2: Duplicate content
  const duplicateCheck = detectDuplicate(params);
  if (duplicateCheck.isSpam) {
    return duplicateCheck;
  }

  // Check 3: Rapid posting
  const rateCheck = detectRapidPosting(params);
  if (rateCheck.isSpam) {
    return rateCheck;
  }

  return {
    isSpam: false,
    confidence: 'low',
  };
}

// Helper functions

function calculateUpperCaseRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return 0;

  const upperCase = text.replace(/[^A-Z]/g, '');
  return upperCase.length / letters.length;
}

function calculateEmojiRatio(text: string): number {
  // Simple emoji detection (Unicode ranges)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

  const emojis = text.match(emojiRegex) || [];
  if (text.length === 0) return 0;

  return emojis.length / text.length;
}

function calculateSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
