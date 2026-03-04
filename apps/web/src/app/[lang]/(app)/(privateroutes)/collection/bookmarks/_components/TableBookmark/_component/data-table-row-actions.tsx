'use client';

import { Link } from "@/lib/i18n/navigation";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { ModalShare } from '@/components/Modals/Share/ModalShare';
import { useModal } from '@/context/modal-context';
import { createShareController } from "@/components/ShareController/ShareController";
import { ShareControllerMovie } from "@/components/ShareController/ShareControllerMovie";
import { ModalUserWatchlistMovieComment } from "@/components/Modals/watchlist/ModalUserWatchlistMovieComment";
import { useCallback, useMemo } from "react";
import { useUserBookmarkDeleteByMediaMutation } from "@libs/query-client";
import { BookmarkWithMedia } from "./types";
import { getMediaDetails } from "@/utils/get-media-details";
import { ModalRecoSend } from "@/components/Modals/recos/ModalRecoSend";
import { ShareControllerTvSeries } from "@/components/ShareController/ShareControllerTvSeries";

interface DataTableRowActionsProps {
  data: BookmarkWithMedia;
}

export function DataTableRowActions({
  data,
}: DataTableRowActionsProps) {
  const t = useTranslations();
  const { openModal, createConfirmModal } = useModal();
  const { mutateAsync: deleteWatchlistMovie } = useUserBookmarkDeleteByMediaMutation();
  const details = useMemo(() => {
    switch (data.type) {
      case 'movie':
        return getMediaDetails({
          type: 'movie',
          media: data.media,
        })
      case 'tv_series':
        return getMediaDetails({
          type: 'tv_series',
          media: data.media,
        })
      default:
        return null;
    }
  }, [data]);

  const handleUnwatchlist = useCallback(async () => {
    if (!data) return;
    await deleteWatchlistMovie({
      path: {
        media_id: data.mediaId,
        type: data.type,
      },
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.deleted')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [data, deleteWatchlistMovie, t]);

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4 text-accent-yellow" />
            <span className="sr-only">{upperFirst(t('common.messages.open_menu'))}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
          onClick={() => openModal(ModalRecoSend, {
            mediaId: data.mediaId,
            mediaTitle: data.type === 'movie' ? data.media.title : data.media.name,
            mediaType: data.type
          })}
          >
            <Icons.send className='w-4' />
            {upperFirst(t('common.messages.send_to_friend'))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={data.media.url ?? ''}>
              <Icons.eye className='w-4' />
              {data.type === 'movie'
                ? upperFirst(t('common.messages.go_to_film'))
                : upperFirst(t('common.messages.go_to_tv_series'))
              }
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
          onClick={() => openModal(ModalUserWatchlistMovieComment, { watchlistItem: data })}
          >
            <Icons.comment className='w-4' />
            {data.comment ? upperFirst(t('common.messages.view_comment', { count: 1 })) : upperFirst(t('common.messages.add_comment', { count: 1 }))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openModal(ModalShare, {
              title: details?.title || '',
              type: data.type,
              path: data.media.url || '',
              shareController: data.type === 'movie'
                ? createShareController(ShareControllerMovie, { movie: data.media })
                : createShareController(ShareControllerTvSeries, { tvSeries: data.media }),
            })}
          >
            <Icons.share className='w-4' />
            {upperFirst(t('common.messages.share'))}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => createConfirmModal({
              title: upperFirst(t('pages.collection.watchlist.modal.delete_confirm.title')),
              description: t.rich('pages.collection.watchlist.modal.delete_confirm.description', {
                title: details?.title || '',
                important: (chunk) => <b>{chunk}</b>,
              }),
              onConfirm: handleUnwatchlist,
            })}
          >
            <Icons.delete className='w-4' />
            {upperFirst(t('common.messages.delete'))}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};