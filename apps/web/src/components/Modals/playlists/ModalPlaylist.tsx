'use client'

import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { Button } from '@/components/ui/button';
import { UserCogIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { ModalPlaylistMembers } from './ModalPlaylistMembers/ModalPlaylistMembers';
import { PlaylistForm } from '@/components/Playlist/PlaylistForm/PlaylistForm';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Playlist } from '@packages/api-js';

interface ModalPlaylistProps extends ModalType {
  playlist?: Playlist;
}

export function ModalPlaylist({
  playlist,
  ...props
} : ModalPlaylistProps) {
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
              onClick={() => openModal(ModalPlaylistMembers, { playlistId: playlist.id })}
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
        playlist={playlist}
        />
      </ModalBody>
    </Modal>
  )
}
