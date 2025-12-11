import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'upravo sad';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `prije ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `prije ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `prije ${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `prije ${weeks}t`;
  const months = Math.floor(days / 30);
  if (months < 12) return `prije ${months}mj`;
  const years = Math.floor(days / 365);
  return `prije ${years}g`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function generateSlug(title: string): string {
  const croatianMap: Record<string, string> = {
    'č': 'c', 'ć': 'c', 'đ': 'd', 'š': 's', 'ž': 'z',
    'Č': 'c', 'Ć': 'c', 'Đ': 'd', 'Š': 's', 'Ž': 'z',
  };

  let slug = title.toLowerCase();

  // Replace Croatian characters
  for (const [char, replacement] of Object.entries(croatianMap)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement);
  }

  // Replace spaces and special chars with hyphens, remove non-alphanumeric
  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Add timestamp for uniqueness
  const timestamp = Date.now().toString(36);

  return `${slug}-${timestamp}`;
}
