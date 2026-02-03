'use client'

import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { Playlist } from '@recomendapp/types';
import { Modal, ModalBody, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { Button } from '@/components/ui/button';
import { UserCogIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { ModalPlaylistGuest } from './ModalPlaylistGuest/ModalPlaylistGuest';
import { PlaylistForm } from '@/components/Playlist/PlaylistForm/PlaylistForm';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

interface PlaylistModalProps extends ModalType {
  playlist?: Playlist;
  filmId?: string;
}

export function PlaylistModal({
  filmId,
  playlist,
  ...props
} : PlaylistModalProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const { openModal, closeModal } = useModal();

  if (!user) return null;

  return (
    <Modal open={props.open} onOpenChange={(open) => !open && closeModal(props.id)}>
      <ModalHeader>
        <ModalTitle className='flex gap-4 items-center'>
          {playlist ? upperFirst(t('common.messages.edit_playlist')) : upperFirst(t('common.messages.create_a_playlist'))}
          {playlist && (
            <TooltipBox tooltip={upperFirst(t('common.messages.guest', { count: 2, gender: 'male' }))}>
              <Button
              variant={'outline'}
              size={'icon'}
              onClick={() => openModal(ModalPlaylistGuest, { playlistId: playlist.id })}
              >
                <UserCogIcon size={20}/>
              </Button>
            </TooltipBox>
          )}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <PlaylistForm
          success={() => closeModal(props.id)}
          filmId={filmId}
          playlist={playlist}
        />
      </ModalBody>
    </Modal>
  )
}
