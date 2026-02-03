'use client';

import { Link } from "@/lib/i18n/navigation";
import { usePathname } from '@/lib/i18n/navigation';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {}

export function SettingsNav({ className, ...props }: SidebarNavProps) {
  const t = useTranslations('pages.settings');
  const pathname = usePathname();

  const settingsNavItems = [
    {
      title: t('profile.label'),
      href: '/settings/profile',
    },
    {
      title: t('account.label'),
      href: '/settings/account',
    },
    {
      title: t('appearance.label'),
      href: '/settings/appearance',
    },
    {
      title: t('subscription.label'),
      href: '/settings/subscription',
    },
    {
      title: t('security.label'),
      href: '/settings/security',
    },
    {
      title: t('notifications.label'),
      href: '/settings/notifications',
    },
    {
      title: t('data.label'),
      href: '/settings/data',
    },
  ];

  return (
    <ScrollArea>
      <nav
        className={cn(
          'flex space-x-2 pb-2 lg:pb-0 lg:flex-col lg:space-x-0 lg:space-y-1',
          className
        )}
        {...props}
      >
        {settingsNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              pathname === item.href
                ? 'bg-muted hover:bg-muted'
                : 'hover:bg-transparent hover:underline',
              'justify-start'
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
