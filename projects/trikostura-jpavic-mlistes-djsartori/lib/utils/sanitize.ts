/**
 * Sanitizes user input to prevent injection attacks
 * @param input - The user input to sanitize
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  sanitized = sanitized.slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs for content fields)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitizes search queries - more restrictive than general input
 * @param query - The search query to sanitize
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 200): string {
  let sanitized = sanitizeInput(query, maxLength);

  // Remove SQL wildcards that could be abused
  // Note: Supabase handles escaping, but we limit potential abuse
  sanitized = sanitized.replace(/[%;]/g, '');

  return sanitized;
}

/**
 * Validates username format
 * @param username - The username to validate
 * @returns true if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  // Alphanumeric, underscores, hyphens only, 3-20 chars
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

/**
 * Validates email format (basic)
 * @param email - The email to validate
 * @returns true if valid format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
