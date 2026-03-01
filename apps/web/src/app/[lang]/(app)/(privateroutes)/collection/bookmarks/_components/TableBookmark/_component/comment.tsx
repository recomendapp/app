import { useModal } from '@/context/modal-context';
import { MessageSquarePlusIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { BookmarkWithMedia } from './types';
import { ModalBookmarkComment } from '@/components/Modals/bookmarks/ModalBookmarkComment';

export function Comment({ data }: { data: BookmarkWithMedia }) {

  const { openModal } = useModal();

  return (
    <p
      onClick={() => openModal(ModalBookmarkComment, { data })}
      className={`cursor-pointer text-muted-foreground`}
    >
      {data?.comment && <span className='line-clamp-2 break-all'>{data.comment}</span>}
      {!data?.comment &&
        <TooltipBox tooltip='Ajouter un commentaire'>
          <MessageSquarePlusIcon className='w-5 h-5' />
        </TooltipBox>
      }
    </p>
  );
}
