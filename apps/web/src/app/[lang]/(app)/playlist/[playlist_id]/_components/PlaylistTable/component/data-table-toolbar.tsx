'use client';
'use no memo';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@libs/ui/components/button';
import { Input } from '@libs/ui/components/input';
import { useAuth } from '@/context/auth-context';
import { Icons } from '@/config/icons';
import { useModal } from '@/context/modal-context';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { ModalShare } from '@/components/Modals/Share/ModalShare';
import PlaylistActionSave from '@/components/Playlist/actions/PlaylistActionSave';
import { TableViewOptions } from '@/components/tables/TableViewOptions';
import { TableSortOptions } from '@/components/tables/TableSortOptions';
import { Playlist } from '@libs/api-js';
import PlaylistActionLike from '@/components/Playlist/actions/PlaylistActionLike';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  playlist: Playlist;
}

export function DataTableToolbar<TData>({ table, playlist }: DataTableToolbarProps<TData>) {
  const t = useTranslations();
  const { user } = useAuth();
  const { openModal } = useModal();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col-reverse items-end lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex flex-1 items-center gap-2 w-full">
        <Input
          placeholder={upperFirst(t('pages.playlist.search.placeholder'))}
          value={(table.getColumn('item')?.getFilterValue() as string) ?? ''}
          onChange={(event) => {
            table.getColumn('item')?.setFilterValue(event.target.value);
          }}
          className="h-8 w-full lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {upperFirst(t('common.messages.cancel'))}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="w-full lg:w-fit flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {playlist && user?.id !== playlist.userId ? (
            <>
              <PlaylistActionLike playlistId={playlist.id} />
              <PlaylistActionSave playlistId={playlist.id} />
            </>
          ) : null}
          <Button
            size={'icon'}
            variant={'outline'}
            onClick={() =>
              openModal(ModalShare, {
                title: playlist?.title,
                type: 'playlist',
                path: `/playlist/${playlist?.id}`,
              })
            }
          >
            <Icons.share />
            <span className="sr-only">{upperFirst(t('common.messages.share'))}</span>
          </Button>
        </div>
        <div className="w-fit flex items-center gap-2">
          <TableSortOptions table={table} />
          <TableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
