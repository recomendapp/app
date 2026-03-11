import { useModal } from '@/context/modal-context';
import { MessageSquarePlusIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { usePlaylist } from '@/hooks/use-playlist';
import { PlaylistItemWithMedia } from '@packages/api-js';
import ModalPlaylistComment from '@/components/Modals/playlists/ModalPlaylistComment';

export function DataComment({ data }: { data: PlaylistItemWithMedia }) {
  const t = useTranslations();
  const { openModal } = useModal();
  const { canEdit } = usePlaylist({
    playlistId: data.playlistId,
  });
  return (
    <>
      <p
        onClick={() => openModal(ModalPlaylistComment, { data })}
        className={` cursor-pointer
          text-muted-foreground
        `}
      >
        {data.comment && <span className='line-clamp-2 break-all'>{data.comment}</span>}
        {!data.comment && canEdit &&
          <TooltipBox tooltip={upperFirst(t('common.messages.add_comment', { count: 1 }))}>
            <MessageSquarePlusIcon className='w-5 h-5' />
          </TooltipBox>
        }
      </p>
    </>
  );
}