'use client'

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
import { UserRecosTvSeriesAggregated } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { Icons } from '@/config/icons';
import { ModalShare } from '@/components/Modals/Share/ModalShare';
import { useModal } from '@/context/modal-context';
import { createShareController } from "@/components/ShareController/ShareController";
import { useAuth } from "@/context/auth-context";
import { ModalRecosSenders } from "@/components/Modals/recos/ModalRecosSenders";
import { ShareControllerTvSeries } from "@/components/ShareController/ShareControllerTvSeries";
import { ModalUserRecosTvSeriesSend } from "@/components/Modals/recos/ModalUserRecosTvSeriesSend";
import { useUserRecosTvSeriesCompleteMutation, useUserRecosTvSeriesDeleteMutation } from "@/api/client/mutations/userMutations";
import { useCallback } from "react";

interface DataTableRowActionsProps {
  table: Table<UserRecosTvSeriesAggregated>;
  row: Row<UserRecosTvSeriesAggregated>;
  column: Column<UserRecosTvSeriesAggregated, unknown>;
  data: UserRecosTvSeriesAggregated;
}

export function DataTableRowActions({
  row,
  table,
  column,
  data,
}: DataTableRowActionsProps) {
  const { session } = useAuth();
  const t = useTranslations();
  const { openModal, createConfirmModal } = useModal();
  const { mutateAsync: mutateDeleteReco} = useUserRecosTvSeriesDeleteMutation();
  const { mutateAsync: mutateCompleteReco } = useUserRecosTvSeriesCompleteMutation();

  const handleDeleteReco = useCallback(async () => {
    if (!session || !data?.tv_series_id) {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
      return;
    }
    await mutateDeleteReco({
      userId: session.user.id,
      tvSeriesId: data?.tv_series_id,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.deleted')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [session, data.tv_series_id, mutateDeleteReco, t]);

  const handleCompleteReco = useCallback(async () => {
    if (!session || !data?.tv_series_id) {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
      return;
    }
    await mutateCompleteReco({
      userId: session.user.id,
      tvSeriesId: data?.tv_series_id,
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.completed')));
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [session, data.tv_series_id, mutateCompleteReco, t]);

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
            onClick={() => createConfirmModal({
              title: upperFirst(t('pages.collection.my_recos.modal.complete_confirm.title')),
              description: t.rich('pages.collection.my_recos.modal.complete_confirm.description', {
                title: data.tv_series?.name!,
                important: (chunk) => <b>{chunk}</b>,
              }),
              onConfirm: handleCompleteReco,
            })}
          >
            <Icons.check className='w-4' />
            {upperFirst(t('common.messages.complete'))}
          </DropdownMenuItem>
          <DropdownMenuItem
          onClick={() => openModal(ModalUserRecosTvSeriesSend, { tvSeriesId: data.tv_series_id!, tvSeriesTitle: data.tv_series?.name! })}
          >
            <Icons.send className='w-4' />
            {upperFirst(t('common.messages.send_to_friend'))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={data?.tv_series?.url ?? ''}>
              <Icons.eye className='w-4' />
              {upperFirst(t('common.messages.go_to_tv_series'))}
            </Link>
          </DropdownMenuItem>
          {data?.senders?.length! > 0 && (
            <DropdownMenuItem
              onClick={() => openModal(ModalRecosSenders, { comments: row.original?.senders })}
            >
              <Icons.comment className='w-4' />
              {upperFirst(t('common.messages.view_recommendation', { count: data?.senders?.length }))}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openModal(ModalShare, {
              title: data?.tv_series?.name,
              type: 'tv_series',
              path: data?.tv_series?.url ?? '',
              shareController: createShareController(ShareControllerTvSeries, { tvSeries: data?.tv_series! }),
            })}
          >
            <Icons.share className='w-4' />
            {upperFirst(t('common.messages.share'))}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => createConfirmModal({
              title: upperFirst(t('pages.collection.my_recos.modal.delete_confirm.title')),
              description: t.rich('pages.collection.my_recos.modal.delete_confirm.description', {
                title: data.tv_series?.name!,
                important: (chunk) => <b>{chunk}</b>,
              }),
              onConfirm: handleDeleteReco,
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