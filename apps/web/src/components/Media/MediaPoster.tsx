'use client';

import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { cn } from '@/lib/utils';
import React from 'react';

interface MediaPosterProps extends React.ComponentProps<typeof ImageWithFallback> {
  classNameFallback?: string;
}

const MediaPoster = React.forwardRef<
  HTMLImageElement,
  MediaPosterProps
>(({ children, className, classNameFallback, alt, ...props }, ref) => {
  return (
    <div
      className={cn(
        'shadow-md relative shrink-0 w-full aspect-2/3 overflow-hidden',
        className
      )}
    >
      <ImageWithFallback
        ref={ref}
        alt={alt}
        className={cn("rounded-md object-cover", classNameFallback)}
        type='movie'
        {...props}
      />
      {children}
    </div>
  );
});
MediaPoster.displayName = 'MediaPoster';

export default MediaPoster;
