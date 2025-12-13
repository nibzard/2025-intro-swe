/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// ============================================
// FILE UPLOAD LIMITS
// ============================================

export const FILE_UPLOAD = {
  /** Maximum file size in bytes (10MB) */
  MAX_SIZE: 10 * 1024 * 1024,

  /** Maximum file size for compression threshold (2MB) */
  COMPRESSION_THRESHOLD: 2 * 1024 * 1024,

  /** Allowed file types for uploads */
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,

  /** Maximum number of attachments per post */
  MAX_ATTACHMENTS: 5,
} as const;

// ============================================
// IMAGE PROCESSING
// ============================================

export const IMAGE = {
  /** Maximum dimension for image compression (width/height) */
  MAX_DIMENSION: 1920,

  /** Image compression quality (0-1) */
  COMPRESSION_QUALITY: 0.85,

  /** Avatar image dimensions */
  AVATAR_SIZE: 200,

  /** Banner image dimensions */
  BANNER_WIDTH: 1200,
  BANNER_HEIGHT: 300,
} as const;

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMIT = {
  /** General actions (votes, bookmarks) - requests per minute */
  GENERAL_RPM: 20,

  /** Strict actions (posts, replies) - requests per minute */
  STRICT_RPM: 5,

  /** Lenient actions (reads, searches) - requests per minute */
  LENIENT_RPM: 60,

  /** Rate limit window in milliseconds (1 minute) */
  WINDOW_MS: 60 * 1000,
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  /** Topics per page on category/forum pages */
  TOPICS_PER_PAGE: 20,

  /** Replies per page on topic pages */
  REPLIES_PER_PAGE: 50,

  /** Search results per page */
  SEARCH_RESULTS_PER_PAGE: 15,

  /** Notifications per page */
  NOTIFICATIONS_PER_PAGE: 20,

  /** Users per page on users list */
  USERS_PER_PAGE: 24,
} as const;

// ============================================
// VALIDATION
// ============================================

export const VALIDATION = {
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 6,

  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 128,

  /** Username min/max length */
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,

  /** Topic title min/max length */
  TOPIC_TITLE_MIN: 5,
  TOPIC_TITLE_MAX: 200,

  /** Topic content min/max length */
  TOPIC_CONTENT_MIN: 10,
  TOPIC_CONTENT_MAX: 50000,

  /** Reply content min/max length */
  REPLY_CONTENT_MIN: 1,
  REPLY_CONTENT_MAX: 20000,

  /** Bio max length */
  BIO_MAX_LENGTH: 500,

  /** Full name max length */
  FULL_NAME_MAX_LENGTH: 100,
} as const;

// ============================================
// AUTHENTICATION & SECURITY
// ============================================

export const AUTH = {
  /** Password reset code expiry in minutes */
  RESET_CODE_EXPIRY_MINUTES: 15,

  /** Email verification code expiry in hours */
  VERIFICATION_CODE_EXPIRY_HOURS: 24,

  /** Session timeout in days */
  SESSION_TIMEOUT_DAYS: 7,
} as const;

// ============================================
// NOTIFICATIONS
// ============================================

export const NOTIFICATIONS = {
  /** Polling interval for new notifications (ms) */
  POLL_INTERVAL_MS: 30 * 1000, // 30 seconds

  /** Maximum notifications to fetch per request */
  MAX_FETCH: 20,

  /** Notification types */
  TYPES: {
    REPLY: 'reply',
    UPVOTE: 'upvote',
    MENTION: 'mention',
    TOPIC_PINNED: 'topic_pinned',
    FOLLOW: 'follow',
    MESSAGE: 'message',
  } as const,
} as const;

// ============================================
// REPUTATION & GAMIFICATION
// ============================================

export const REPUTATION = {
  /** Points for creating a topic */
  TOPIC_CREATED: 5,

  /** Points for creating a reply */
  REPLY_CREATED: 2,

  /** Points for receiving an upvote */
  UPVOTE_RECEIVED: 1,

  /** Points lost for receiving a downvote */
  DOWNVOTE_RECEIVED: -1,

  /** Points for having a reply marked as solution */
  SOLUTION_ACCEPTED: 15,
} as const;

// ============================================
// CACHE & PERFORMANCE
// ============================================

export const CACHE = {
  /** ISR revalidation time for topic pages (seconds) */
  TOPIC_REVALIDATE: 60,

  /** ISR revalidation time for category pages (seconds) */
  CATEGORY_REVALIDATE: 30,

  /** ISR revalidation time for user profiles (seconds) */
  PROFILE_REVALIDATE: 300, // 5 minutes

  /** ISR revalidation time for static pages (seconds) */
  STATIC_REVALIDATE: 3600, // 1 hour
} as const;

// ============================================
// SEARCH
// ============================================

export const SEARCH = {
  /** Minimum search query length */
  MIN_QUERY_LENGTH: 2,

  /** Maximum search query length */
  MAX_QUERY_LENGTH: 100,

  /** Debounce delay for search input (ms) */
  DEBOUNCE_MS: 300,
} as const;

// ============================================
// UI & UX
// ============================================

export const UI = {
  /** Toast notification duration (ms) */
  TOAST_DURATION: 3000,

  /** Skeleton loading min display time (ms) */
  SKELETON_MIN_DISPLAY: 200,

  /** Animation duration for transitions (ms) */
  ANIMATION_DURATION: 200,
} as const;

// ============================================
// EXPORT ALL
// ============================================

export const CONSTANTS = {
  FILE_UPLOAD,
  IMAGE,
  RATE_LIMIT,
  PAGINATION,
  VALIDATION,
  AUTH,
  NOTIFICATIONS,
  REPUTATION,
  CACHE,
  SEARCH,
  UI,
} as const;

export default CONSTANTS;
