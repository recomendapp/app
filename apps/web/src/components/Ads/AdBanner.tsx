'use client';

import { useEffect, useRef } from 'react';

type AdBannerProps = {
  dataAdSlot: string;
  className?: string;
};

export default function AdBanner({ dataAdSlot, className = 'my-6' }: AdBannerProps) {
  const adLoaded = useRef(false);

  useEffect(() => {
    if (!adLoaded.current && typeof window !== 'undefined') {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        adLoaded.current = true;
      } catch (error) {
        console.error('Erreur de chargement AdSense:', error);
      }
    }
  }, []);

  return (
    <div
      className={`flex w-full min-h-[250px] items-center justify-center overflow-hidden rounded-md border bg-muted ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID}
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
