'use client'

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useAuth } from '@/context/auth-context';
import { UserAvatar } from './UserAvatar';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { Icons } from '@/config/icons';
import { upperFirst } from 'lodash';
import { cn } from '@/lib/utils';
import { Spinner } from '../ui/spinner';
import toast from 'react-hot-toast';

type Route = {
  icon: React.ElementType;
  label: string;
  href: string;
  shortcut?: string;
  target?: string;
  visible?: boolean;
  className?: string;
};

export function UserNav({
  className,
} : {
  className?: string;
}) {
  const router = useRouter();
  const { user, customerInfo, logout } = useAuth();
  const t = useTranslations();

  const routes = useMemo((): Route[] => [
    {
      icon: Icons.shop,
      label: upperFirst(t('common.messages.shop')),
      href: 'https://shop.recomend.app/',
      shortcut: '↗',
      target: '_blank',
    },
    {
      icon: Icons.help,
      label: upperFirst(t('common.messages.help')),
      href: 'https://help.recomend.app/',
      shortcut: '↗',
      target: '_blank',
    },
    {
      icon: Icons.about,
      label: upperFirst(t('common.messages.about')),
      href: '/about',
    },
    {
      icon: Icons.legal,
      label: upperFirst(t('common.messages.legal')),
      href: '/legal/terms-of-use',
    },
    {
      icon: Icons.premium,
      label: upperFirst(t('common.messages.upgrade_to_plan', { plan: 'Premium' })),
      href: '/upgrade',
      visible: !customerInfo?.entitlements.active['premium'],
      className: 'fill-accent-blue text-accent-blue!',
    },
    {
      icon: Icons.settings,
      label: upperFirst(t('common.messages.setting', { count: 0 })),
      href: '/settings/profile',
    },
  ], [customerInfo, t]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.refresh();
    } catch (error) {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
    }
  }, [logout, router, t]);

  if (!user) {
    return (
      <Button variant={'outline'}>
        <Spinner />
      </Button>
    );  
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("relative", className)}>
          <UserAvatar className='h-6 w-6' avatarUrl={user.avatar_url} username={user.username} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <DropdownMenuItem asChild>
            <Link href={'/@' + user?.username} className="flex gap-2">
              <UserAvatar avatarUrl={user.avatar_url} username={user.username} />
              <div className="flex flex-col space-y-1 items-start!">
                <p className="text-sm font-medium leading-none line-clamp-1">
                  {user?.full_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  @{user?.username}
                </p>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {routes.filter((route) => route.visible !== false).map((route, i) => (
            <DropdownMenuItem key={i} className={route.className} asChild>
              <Link href={route.href} target={route.target}>
                <route.icon className={"w-4"} />
                <span>{route.label}</span>
                {route.shortcut && <DropdownMenuShortcut>{route.shortcut}</DropdownMenuShortcut>}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <Icons.logout className="w-4" />
          {upperFirst(t('common.messages.logout'))}
          </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
