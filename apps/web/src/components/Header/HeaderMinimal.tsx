import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from "@/lib/i18n/navigation";
import { UserNav } from '@/components/User/UserNav';
import { Icons } from '@/config/icons';
import { getTranslations } from 'next-intl/server';
import { getMe } from '@/lib/auth/server';

export async function HeaderMinimal({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const t = await getTranslations();

  const {
    data,
  } = await getMe();

  return (
    <header
      className={cn(
        'sticky top-0 z-1 bg-background flex justify-between items-center p-4 h-header w-screen',
        className
      )}
    >
      <Link href={'/'} className={'p-1'}>
        <Icons.site.logo className="hidden sm:block fill-accent-yellow w-48" />
        <Icons.site.icon className="sm:hidden fill-accent-yellow w-10" />
      </Link>
      {data ? (
        <UserNav />
      ) : (
        <Button asChild>
          <Link href={'/auth/login'} className="whitespace-nowrap">
            {t('common.messages.login')}
          </Link>
        </Button>
      )}
    </header>
  );
}
