import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  className?: string;
  username?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

// Generate a consistent color based on username
function getAvatarColor(username?: string): string {
  if (!username) return 'from-blue-500 to-indigo-600';

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-green-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
  ];

  // Simple hash function to get consistent color for username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function Avatar({ src, alt, size = 'md', fallback, className = '', username }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const fallbackText = fallback || (username || alt).charAt(0).toUpperCase();
  const gradientColor = getAvatarColor(username || alt);

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes={`${sizePx[size]}px`}
        />
      ) : (
        <span className={`text-white font-bold ${sizeClass.split(' ')[2]}`}>
          {fallbackText}
        </span>
      )}
    </div>
  );
}
