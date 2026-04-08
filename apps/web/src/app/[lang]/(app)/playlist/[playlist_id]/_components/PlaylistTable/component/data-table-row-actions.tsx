'use client';

import { Link } from "@/lib/i18n/navigation";
import { Column, Row, Table } from '@tanstack/react-table';
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
import { useAuth } from "@/context/auth-context";
import { ShareControllerMovie } from "@/components/ShareController/ShareControllerMovie";
import { ModalRecoSend } from "@/components/Modals/recos/ModalRecoSend";
import { usePlaylist } from "@/hooks/use-playlist";
import { useCallback, useMemo } from "react";
import { getMediaDetails } from "@/utils/get-media-details";
import { ShareControllerTvSeries } from "@/components/ShareController/ShareControllerTvSeries";
import { PlaylistItemWithMedia } from "@libs/api-js";
import ModalPlaylistComment from "@/components/Modals/playlists/ModalPlaylistComment";
import { usePlaylistItemsDeleteMutation } from "@libs/query-client";
import { ModalPlaylistAdd } from "@/components/Modals/playlists/ModalPlaylistAdd";

interface DataTableRowActionsProps {
  table: Table<PlaylistItemWithMedia>;
  row: Row<PlaylistItemWithMedia>;
  column: Column<PlaylistItemWithMedia, unknown>;
  data: PlaylistItemWithMedia;
}

export function DataTableRowActions({
  row,
  table,
  column,
  data,
}: DataTableRowActionsProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const { canEdit } = usePlaylist({
    playlistId: data.playlistId,
  });
  const { openModal, createConfirmModal } = useModal();

  // Mutations
  const { mutateAsync: deleteItem } = usePlaylistItemsDeleteMutation({
    userId: user?.id,
  });

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

  // Handlers
  const handleDeleteItem = useCallback(async () => {
    await deleteItem({
      path: {
        playlist_id: data.playlistId,
      },
      body: {
        itemIds: [data.id],
      }
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.deleted')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [deleteItem, data, t]);

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
            onClick={() => openModal(ModalPlaylistAdd, { mediaId: data.mediaId, type: data.type, mediaTitle: details?.title })}
          >
            <Icons.addPlaylist className='w-4' />
            {upperFirst(t('common.messages.add_to_playlist'))}
          </DropdownMenuItem>
          <DropdownMenuItem
          onClick={() => openModal(ModalRecoSend, { mediaId: data.mediaId, mediaTitle: details?.title, mediaType: data.type })}
          >
            <Icons.send className='w-4' />
            {upperFirst(t('common.messages.send_to_friend'))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={data.media.url ?? ''}>
              <Icons.eye className='w-4' />
              {upperFirst(t('common.messages.go_to_film'))}
            </Link>
          </DropdownMenuItem>
          {(canEdit || data.comment) && (
            <DropdownMenuItem
              onClick={() => openModal(ModalPlaylistComment, { data: data })}
            >
              <Icons.comment className='w-4' />
              {data.comment ? upperFirst(t('common.messages.view_comment', { count: 1 })) : upperFirst(t('common.messages.add_comment', { count: 1 }))}
            </DropdownMenuItem>
          )}
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
          {canEdit && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => createConfirmModal({
                title: upperFirst(t('common.messages.are_u_sure')),
                description: t.rich('pages.playlist.modal.delete_item_confirm.description', {
                  title: details?.title || '',
                  important: (chunk) => <b>{chunk}</b>,
                }),
                onConfirm: handleDeleteItem,
              })}
            >
              <Icons.delete className='w-4' />
              {upperFirst(t('common.messages.delete'))}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};