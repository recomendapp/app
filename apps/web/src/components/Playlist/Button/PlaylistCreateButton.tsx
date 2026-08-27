'use client';

import { Button } from '@libs/ui/components/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Link } from '@/lib/i18n/navigation';
import { getPlaylistCreateHref } from '@/utils/hrefs/get-playlist-create-href';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export function PlaylistCreateButton({
  className,
  icon = true,
}: {
  className?: string;
  icon?: boolean;
}) {
  const { user } = useAuth();
  const t = useTranslations();

  if (!user) return null;

  return (
    <TooltipBox tooltip={upperFirst(t('common.messages.create_a_playlist'))}>
      <Button variant={'outline'} size={'icon'} className={cn(className)} asChild>
        <Link href={getPlaylistCreateHref()}>
          {icon ? <Plus /> : upperFirst(t('common.messages.create_a_playlist'))}
          {icon && (
            <span className="sr-only">{upperFirst(t('common.messages.create_a_playlist'))}</span>
          )}
        </Link>
      </Button>
    </TooltipBox>
  );
}
