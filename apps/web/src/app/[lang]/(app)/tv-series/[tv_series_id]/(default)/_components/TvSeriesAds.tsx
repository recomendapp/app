'use client';

import AdBanner from '@/components/Ads/AdBanner';
import { useAuth } from '@/context/auth-context';

export const TvSeriesAds = () => {
  const { session } = useAuth();

  if (session) return null;

  return <AdBanner dataAdSlot="2164978961" />;
};
