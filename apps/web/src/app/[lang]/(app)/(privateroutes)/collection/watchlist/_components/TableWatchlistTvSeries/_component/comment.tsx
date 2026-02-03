import { useModal } from '@/context/modal-context';
import { UserWatchlistTvSeries } from '@recomendapp/types';
import { MessageSquarePlusIcon } from 'lucide-react';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { ModalUserWatchlistTvSeriesComment } from '@/components/Modals/watchlist/ModalUserWatchlistTvSeriesComment';

export function Comment({ watchlistItem }: { watchlistItem: UserWatchlistTvSeries }) {

  const { openModal } = useModal();

  return (
    <p
      onClick={() => openModal(ModalUserWatchlistTvSeriesComment, { watchlistItem })}
      className={`cursor-pointer text-muted-foreground`}
    >
      {watchlistItem?.comment && <span className='line-clamp-2 break-all'>{watchlistItem.comment}</span>}
      {!watchlistItem?.comment &&
        <TooltipBox tooltip='Ajouter un commentaire'>
          <MessageSquarePlusIcon className='w-5 h-5' />
        </TooltipBox>
      }
    </p>
  );
}
