'use client';

import Image from 'next/image';
import { ComponentProps, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, ListVideo, UserIcon } from 'lucide-react';
import { MediaType } from '@recomendapp/types';

interface ImageWithFallbackProps extends Omit<ComponentProps<typeof Image>, 'src'> {
  src?: string | null;
  type?: 'default' | 'playlist' | 'service' | 'watch-provider' | MediaType | null;
  blurDataURL?: string;
}

export const ImageWithFallback = ({
  src,
  alt,
  type = 'default',
  blurDataURL,
  className,
  ...rest
}: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <>
      {imgSrc ? (
        <Image
          alt={alt}
          src={imgSrc}
          className={cn('', className)}
          onError={() => {
            setImgSrc('');
          }}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          {...rest}
        />
      ) : (
        <Fallback className={cn('', className)} type={type} from="#363636" to="#363636" alt={alt} />
      )}
    </>
  );
};

export function Fallback({
  className,
  type,
  from,
  to,
  alt,
}: {
  className?: string;
  type?: string | null;
  from: string;
  to: string;
  alt: string;
}) {
  return (
    <div
      style={{
        backgroundImage: `linear-gradient(to top right, ${from}, ${to})`,
      }}
      className={cn(`w-full flex items-center justify-center h-full`, className)}
    >
      {type == 'playlist' ? (
        <ListVideo color="#fff" className="w-2/5 h-2/5" />
      ) : type == 'person' ? (
        <UserIcon color="#fff" className="w-2/5 h-2/5" />
      ) : type == 'movie' ? (
        <span className="text-muted-foreground text-clamp-2 text-center">
          {alt}
        </span>
      ) : type == 'tv_series' ? (
        <span className="text-muted-foreground text-clamp-2 text-center">
          {alt}
        </span>
      ) : type == 'service' ? (
        <span className="text-muted-foreground text-clamp-2 text-center">
          {alt}
        </span>
      ) : (
        <ImageIcon color="#fff" className="w-2/5 h-2/5" />
      )}
    </div>
  );
}
