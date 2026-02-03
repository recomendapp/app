'use client';

import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { cn } from '@/lib/utils';

export default function PersonPoster({
  className,
  poster_path,
  alt,
}: {
  className?: string;
  poster_path: string;
  alt: string;
}) {
  return (
    <div
      className={cn(
        'shadow-md z-0 relative shrink-0 w-full aspect-square',
        className
      )}
    >
      <ImageWithFallback
      src={getTmdbImage({ path: poster_path, size: 'w1280' })}
      alt={alt}
      fill
      unoptimized
      className="rounded-md object-cover z-0"
      />
    </div>
  );
}
