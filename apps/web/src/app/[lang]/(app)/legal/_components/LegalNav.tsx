'use client';

import { Link } from "@/lib/i18n/navigation";
import { usePathname } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { upperFirst } from "lodash";
import { useMemo } from "react";

interface LegalNavProps extends React.HTMLAttributes<HTMLElement> {}

export function LegalNav({ className, ...props }: LegalNavProps) {
  const t = useTranslations('common.messages');
  const pathname = usePathname();

  const legalNavItems = useMemo(() => [
    {
		title: upperFirst(t('terms_of_use')),
		href: '/legal/terms-of-use',
    },
	{
		title: upperFirst(t('privacy_policy')),
		href: '/legal/privacy-policy',
	}
  ], [t]);

  return (
    <ScrollArea>
      <nav
        className={cn(
          'flex space-x-2 pb-2 lg:pb-0 lg:flex-col lg:space-x-0 lg:space-y-1',
          className
        )}
        {...props}
      >
        {legalNavItems.map((item) => (
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
