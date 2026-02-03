'use client'

import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { Link } from "@/lib/i18n/navigation";
import { usePathname } from '@/lib/i18n/navigation';
import { useMemo } from 'react';

const type = 'film';

export const MovieNavbar = ({
  movieSlug,
}: {
  movieSlug: string;
}) => {
  const t = useTranslations();
  const pathname = usePathname();
  const regex = `^/${type}/${movieSlug}(-[a-z0-9-]*)?`;
  const routes = useMemo(() => [
    {
      label: upperFirst(t('common.messages.details')),
      active: pathname.match(new RegExp(regex + '$')),
      href: `/${type}/${movieSlug}`,
    },
    {
      label: upperFirst(t('common.messages.review', { count: 2 })),
      active: pathname.match(new RegExp(regex + '/reviews')),
      href: `/${type}/${movieSlug}/reviews`,
    },
    {
      label: upperFirst(t('common.messages.playlist', { count: 2 })),
      active: pathname.match(new RegExp(regex + '/playlists')),
      href: `/${type}/${movieSlug}/playlists`,
    },
  ], [t, pathname, regex, movieSlug]);

  return (
    <div className="inline-flex h-10 items-center justify-center bg-muted p-1 text-muted-foreground w-full rounded-md mb-4">
      {routes.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`w-full rounded-md inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium ring-offset-background transition-all 
            focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
            disabled:pointer-events-none disabled:opacity-50 
            ${item.active && 'bg-background text-accent-yellow shadow-xs'}
          `}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
