'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { PlaylistModal } from '@/components/Modals/playlists/PlaylistModal';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

export function PlaylistCreateButton({
  className,
  icon = true,
  filmId,
}: {
  className?: string;
  icon?: boolean;
  filmId?: string;
}) {
  const { user } = useAuth();
  const t = useTranslations();
  const { openModal } = useModal();

  if (!user) return null;

  return (
      <TooltipBox tooltip={upperFirst(t('common.messages.create_a_playlist'))}>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn(className)}
          onClick={() => openModal(PlaylistModal, { filmId })}
        >
          {icon ? <Plus /> : upperFirst(t('common.messages.create_a_playlist'))}
          {icon && <span className="sr-only">
            {upperFirst(t('common.messages.create_a_playlist'))}
          </span>}
        </Button>
      </TooltipBox>
  )
}
