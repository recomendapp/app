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
import { PlaylistItemMovie } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { ModalShare } from '@/components/Modals/Share/ModalShare';
import { useModal } from '@/context/modal-context';
import { createShareController } from "@/components/ShareController/ShareController";
import { useAuth } from "@/context/auth-context";
import { ShareControllerMovie } from "@/components/ShareController/ShareControllerMovie";
import { ModalPlaylistMovieAdd } from "@/components/Modals/playlists/ModalPlaylistMovieAdd";
import { ModalUserRecosMovieSend } from "@/components/Modals/recos/ModalUserRecosMovieSend";
import { usePlaylistMovieDeleteMutation } from "@/api/client/mutations/playlistMutations";
import ModaPlaylistMovieComment from "@/components/Modals/playlists/ModalPlaylistMovieComment";
import { useQuery } from "@tanstack/react-query";
import { usePlaylistIsAllowedToEditOptions } from "@/api/client/options/playlistOptions";

interface DataTableRowActionsProps {
  table: Table<PlaylistItemMovie>;
  row: Row<PlaylistItemMovie>;
  column: Column<PlaylistItemMovie, unknown>;
  data: PlaylistItemMovie;
}

export function DataTableRowActions({
  row,
  table,
  column,
  data,
}: DataTableRowActionsProps) {
  const { session } = useAuth();
  const t = useTranslations();
  const { data: isAllowedToEdit } = useQuery(usePlaylistIsAllowedToEditOptions({
    playlistId: row.original.playlist_id,
    userId: session?.user.id
  }));
  const { openModal, createConfirmModal } = useModal();

  // Mutations
  const deletePlaylistItem = usePlaylistMovieDeleteMutation({
    playlistId: row.original.playlist_id
  });

  // Handlers
  const handleDeleteItem = async () => {
    if (!session || !data.movie_id) {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
      return;
    }
    await deletePlaylistItem.mutateAsync({
      itemId: data.id,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.deleted')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  };

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

        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => openModal(ModalPlaylistMovieAdd, { movieId: data.movie_id, movieTitle: data.movie?.title! })}
          >
            <Icons.addPlaylist className='w-4' />
            {upperFirst(t('common.messages.add_to_playlist'))}
          </DropdownMenuItem>
          <DropdownMenuItem
          onClick={() => openModal(ModalUserRecosMovieSend, { movieId: data.movie_id, movieTitle: data.movie?.title! })}
          >
            <Icons.send className='w-4' />
            {upperFirst(t('common.messages.send_to_friend'))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={data.movie?.url ?? ''}>
              <Icons.eye className='w-4' />
              {upperFirst(t('common.messages.go_to_film'))}
            </Link>
          </DropdownMenuItem>
          {(isAllowedToEdit || data.comment) && (
            <DropdownMenuItem
              onClick={() => openModal(ModaPlaylistMovieComment, { playlistItem: data! })}
            >
              <Icons.comment className='w-4' />
              {data.comment ? upperFirst(t('common.messages.view_comment', { count: 1 })) : upperFirst(t('common.messages.add_comment', { count: 1 }))}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openModal(ModalShare, {
              title: data.movie?.title,
              type: 'movie',
              path: data.movie?.url ?? '',
              shareController: createShareController(ShareControllerMovie, { movie: data.movie! }),
            })}
          >
            <Icons.share className='w-4' />
            {upperFirst(t('common.messages.share'))}
          </DropdownMenuItem>
          {isAllowedToEdit && (
            <DropdownMenuItem
              onClick={() => createConfirmModal({
                title: upperFirst(t('common.messages.are_u_sure')),
                description: t.rich('pages.playlist.modal.delete_item_confirm.description', {
                  title: data.movie?.title!,
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