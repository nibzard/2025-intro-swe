import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({ src, alt, size = 'md', fallback, className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const fallbackText = fallback || alt.charAt(0).toUpperCase();

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ${className}`}
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
