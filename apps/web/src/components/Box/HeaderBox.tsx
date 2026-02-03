'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  classNameChild?: string;
  background?: {
    src: string;
    alt: string;
    sizes?: string;
    unoptimized?: boolean;
  }
}

export const HeaderBox: React.FC<BoxProps> = ({
  children,
  className,
  background,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  return (
    <div className='@container/header-box relative'>
      {(!imageError && background) && (
        <Image
          src={background.src}
          alt={background.alt}
          fill
          className="object-cover absolute inset-0"
          sizes={background.sizes || `
          1140px
          `}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          unoptimized={background.unoptimized}
        />
      )}
      <div
        className={cn(
          '@xl/header-box:h-[max(340px,30vh)]',
          'w-full h-full flex p-4 relative transition-colors duration-300 bg-linear-to-t from-background to-[#00000050]',
          'justify-center',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
