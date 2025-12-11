import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Optional custom key function to identify the client
   * Defaults to IP address
   */
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated service
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyGenerator = (req) => {
      // Try to get real IP from various headers
      const forwarded = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      return forwarded?.split(',')[0] || realIp || 'unknown';
    },
  } = config;

  return async (req: NextRequest) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // Initialize or reset the rate limit
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null; // No rate limit hit
    }

    store[key].count += 1;

    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      return NextResponse.json(
        { error: 'Previše zahtjeva. Molimo pokušajte ponovno kasnije.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[key].resetTime.toString(),
          },
        }
      );
    }

    return null; // No rate limit hit
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per minute per IP
   */
  auth: rateLimit({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  }),

  /**
   * Moderate rate limit for API endpoints
   * 20 requests per minute per IP
   */
  api: rateLimit({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  }),

  /**
   * Relaxed rate limit for general endpoints
   * 60 requests per minute per IP
   */
  general: rateLimit({
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  }),
};
