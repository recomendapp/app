'use client';

import { cn } from '@/lib/utils';
import { usePathname } from '@/lib/i18n/navigation';
import { useMemo } from 'react';
import { Link } from "@/lib/i18n/navigation";
import {
  Search,
  Home,
  Library,
  Zap,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Icons } from '@/config/icons';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export function Navbar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const { user } = useAuth();
  const t = useTranslations('common');
  const pathname = usePathname();
  const routes = useMemo(
    () => [
      {
        icon: Home,
        label: upperFirst(t('messages.home')),
        active: pathname === '/',
        href: '/',
      },
      {
        icon: Search,
        label: upperFirst(t('messages.search')),
        active: pathname.startsWith('/search') || pathname.startsWith('/movie'),
        href: '/search',
      },
      {
        icon: Compass,
        label: upperFirst(t('messages.explore')),
        active: pathname === '/map',
        href: '/explore',
      },
      {
        icon: user ? Zap : Icons.shop,
        label: user ? upperFirst(t('messages.feed')) : upperFirst(t('messages.shop')),
        active: user ? pathname.startsWith('/feed') : false,
        href: user ? '/feed' : 'https://shop.recomend.app',
        target: user ? undefined : '_blank',
      },
      {
        icon: user ? Library : Icons.user,
        label: user ? upperFirst(t('messages.library')) : upperFirst(t('messages.login')),
        active:
        user ?
            pathname.startsWith('/collection') ||
            pathname.startsWith('/auth') ||
            pathname.startsWith('/resetPassword') ||
            pathname.startsWith('/verifyEmail')
            : pathname.startsWith('/auth'),
        href: user ? '/collection' : '/auth/login',
      },
    ],
    [pathname, user, t]
  );

  return (
    <div
      className={cn(
        `h-(--navbar-height) bg-navbar border-t w-full grid grid-cols-5 rounded-t-lg`,
        className
      )}
    >
    {routes.map((item) => (
      <Link
        key={item.label}
        href={item.href}
        className={` opacity-100 ${
          !item.active && ' opacity-70'
        } w-full h-full flex flex-col items-center justify-center text-center text-xs gap-1`}
        target={item.target}
      >
        <item.icon className="w-8" />
        {item.label}
      </Link>
    ))}
    </div>
  );
}
