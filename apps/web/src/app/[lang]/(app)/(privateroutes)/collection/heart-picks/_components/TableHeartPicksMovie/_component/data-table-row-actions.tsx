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
import { UserActivityMovie } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { ModalShare } from '@/components/Modals/Share/ModalShare';
import { useModal } from '@/context/modal-context';
import { createShareController } from "@/components/ShareController/ShareController";
import { ShareControllerMovie } from "@/components/ShareController/ShareControllerMovie";
import { ModalUserRecosMovieSend } from "@/components/Modals/recos/ModalUserRecosMovieSend";
import { useUserActivityMovieUpdateMutation } from "@/api/client/mutations/userMutations";
import { useCallback } from "react";

interface DataTableRowActionsProps {
  table: Table<UserActivityMovie>;
  row: Row<UserActivityMovie>;
  column: Column<UserActivityMovie, unknown>;
  data: UserActivityMovie;
}

export function DataTableRowActions({
  row,
  table,
  column,
  data,
}: DataTableRowActionsProps) {
  const t = useTranslations();
  const { openModal, createConfirmModal } = useModal();
  const { mutateAsync: updateActivityMovie } = useUserActivityMovieUpdateMutation();

  const handleUnlike = useCallback(async () => {
    if (!data) return;
    await updateActivityMovie({
      activityId: data.id,
      isLiked: false,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.deleted')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [data, updateActivityMovie, t]);

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
          onClick={() => openModal(ModalUserRecosMovieSend, { movieId: data.movie_id!, movieTitle: data.movie?.title! })}
          >
            <Icons.send className='w-4' />
            {upperFirst(t('common.messages.send_to_friend'))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={data?.movie?.url ?? ''}>
              <Icons.eye className='w-4' />
              {upperFirst(t('common.messages.go_to_film'))}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openModal(ModalShare, {
              title: data?.movie?.title,
              type: 'movie',
              path: data?.movie?.url ?? '',
              shareController: createShareController(ShareControllerMovie, { movie: data?.movie! }),
            })}
          >
            <Icons.share className='w-4' />
            {upperFirst(t('common.messages.share'))}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => createConfirmModal({
              title: upperFirst(t('pages.collection.heart_picks.modal.delete_confirm.label')),
              description: t.rich('pages.collection.heart_picks.modal.delete_confirm.description', {
                title: data.movie?.title!,
                important: (chunk) => <b>{chunk}</b>,
              }),
              onConfirm: handleUnlike,
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