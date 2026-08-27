'use client';

import { useAuth } from '@/context/auth-context';
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../Modal';
import { Button } from '@libs/ui/components/button';
import { UserCogIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { PlaylistForm } from '@/components/Playlist/PlaylistForm/PlaylistForm';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Playlist } from '@libs/api-js';
import { Link } from '@/lib/i18n/navigation';
import { getPlaylistMembersHref } from '@/utils/hrefs/get-playlist-members-href';
import { useQuery } from '@tanstack/react-query';
import { playlistOptions } from '@libs/query-client';
import { useEffect } from 'react';
import { canManagePlaylist } from '@/utils/can-manage-playlist';
import { Icons } from '@/config/icons';

interface ModalPlaylistProps {
  /** Omit to create a new playlist instead of editing one. */
  playlistId?: number;
  onSave?: (data: Playlist) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

export function ModalPlaylist({
  playlistId,
  onSave,
  open,
  onOpenChange,
  onCloseEnd,
}: ModalPlaylistProps) {
  const t = useTranslations();
  const { session } = useAuth();

  const { data: playlist, isError } = useQuery({
    ...playlistOptions({ playlistId }),
    enabled: !!playlistId,
  });

  useEffect(() => {
    if (!session) {
      onOpenChange(false);
      onCloseEnd?.();
      return;
    }
    if (!playlistId) return;
    if (isError) {
      onOpenChange(false);
    } else if (playlist && !canManagePlaylist(playlist.role)) {
      onOpenChange(false);
    }
  }, [session, playlistId, isError, playlist, onOpenChange, onCloseEnd]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} onCloseEnd={onCloseEnd}>
      <ModalHeader>
        <ModalTitle className="flex gap-4 items-center">
          {playlistId
            ? upperFirst(t('common.messages.edit_playlist'))
            : upperFirst(t('common.messages.create_a_playlist'))}
          {playlist && (
            <TooltipBox
              tooltip={upperFirst(t('common.messages.guest', { count: 2, gender: 'male' }))}
            >
              <Button variant={'outline'} size={'icon'} asChild>
                <Link href={getPlaylistMembersHref(playlist.id)}>
                  <UserCogIcon size={20} />
                </Link>
              </Button>
            </TooltipBox>
          )}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        {playlistId && !playlist ? (
          <div className="flex items-center justify-center p-8">
            <Icons.loader />
          </div>
        ) : (
          <PlaylistForm
            onSave={(data) => {
              onSave?.(data);
              onOpenChange(false);
            }}
            playlist={playlist}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
