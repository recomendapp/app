'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@libs/ui/components/button';
import { Icons } from '@/config/icons';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/context/auth-context';
import { Link } from '@/lib/i18n/navigation';
import { useSupportBannerStore } from '@/stores/useSupportBannerStore';

/** How long a close is respected before the banner asks again. */
const DISMISSAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export const SupportBanner = () => {
  const t = useTranslations('components.support_banner');
  const { user } = useAuth();
  const dismissedAt = useSupportBannerStore((state) => state.dismissedAt);
  const dismiss = useSupportBannerStore((state) => state.dismiss);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || user === undefined || user?.isPremium) return null;
  if (dismissedAt !== null && Date.now() - dismissedAt < DISMISSAL_WINDOW_MS) return null;

  return (
    <aside className="bg-accent-yellow text-accent-yellow-foreground animate-in fade-in slide-in-from-top-4 relative flex items-center justify-center gap-2 px-12 py-2 text-center text-sm duration-700">
      <p className="text-balance">
        {t('message', { app: siteConfig.name })}{' '}
        <Link
          href="/upgrade"
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          {t('cta')}
        </Link>
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('dismiss')}
        onClick={dismiss}
        className="absolute top-1/2 right-2 -translate-y-1/2 hover:bg-black/10"
      >
        <Icons.close />
      </Button>
    </aside>
  );
};
