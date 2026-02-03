'use client';

import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { PlaylistGuest, Profile } from '@recomendapp/types';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../../Modal';
import { useCallback, useEffect, useState } from 'react';
import { PlaylistGuestTable } from './components/table/table';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, Check } from 'lucide-react';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Icons } from '@/config/icons';
import { usePlaylistGuestsInsertMutation } from '@/api/client/mutations/playlistMutations';
import { InputSearch } from '@/components/ui/input-search';
import useDebounce from '@/hooks/use-debounce';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { usePlaylistGuestsAddOptions, usePlaylistGuestsOptions } from '@/api/client/options/playlistOptions';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

export const PlaylistGuestView = ({
  playlistGuest,
  playlistId,
  setView
} : {
  playlistGuest: PlaylistGuest[],
  playlistId: number,
  setView: (view: 'guests' | 'add') => void
}) => {
  const t = useTranslations();
  return (
    <>
      <ModalHeader className='px-4 pb-4 pt-5'>
        <ModalTitle>
          {upperFirst(t('common.messages.guests_playlist'))}
        </ModalTitle>
        <ModalDescription>
          {upperFirst(t('common.messages.manage_playlist_access_rights'))}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        {playlistGuest ? (
          <PlaylistGuestTable playlistId={playlistId} guests={playlistGuest} setView={setView} />
        ) : null}
      </ModalBody>
    </>
  )
}

export const PlaylistGuestAddView = ({
  playlistId,
  playlistGuest,
  setView
} : {
  playlistId: number,
  playlistGuest: PlaylistGuest[],
  setView: (view: 'guests' | 'add') => void
}) => {
  const t = useTranslations();
  const { session } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>('');
  const searchQuery = useDebounce(search, 500);
  const { ref, inView } = useInView();

  const {
		data: users,
		isLoading,
		isError,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
	} = useInfiniteQuery(usePlaylistGuestsAddOptions({
    playlistId: playlistId,
    filters: {
      query: searchQuery,
      exclude: playlistGuest.map((guest) => guest?.user_id as string).concat(session?.user.id as string)
    }
  }));
  const { mutateAsync: addUsers, isPending } = usePlaylistGuestsInsertMutation({
    playlistId: playlistId
  });
  
  const handleAddGuest = useCallback(async () => {
    await addUsers({
      playlistId,
      userIds: selectedUsers.map((user) => user?.id as string)
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectedUsers.length })));
        setSelectedUsers([]);
        setView('guests');
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [addUsers, playlistId, selectedUsers, setView, t]);

  useEffect(() => {
		if (inView && hasNextPage) {
		  fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

  return (
    <>
      <ModalHeader className='px-4 pb-4 pt-5'>
        <ModalTitle className='flex gap-4 items-center'>
          <Button
            variant="ghost"
            size={'icon'}
            onClick={() => setView('guests')}
          >
            <ArrowLeftIcon size={20} />
            <span className='sr-only'>{upperFirst(t('common.messages.back'))}</span>
          </Button>
          {upperFirst(t('common.messages.add_guest', { count: 2 }))}
        </ModalTitle>
        <ModalDescription className='text-left'>
          {upperFirst(t('common.messages.add_guests_to_your_playlist'))}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <div className="px-4 mb-4">
          <InputGroup>
            <InputGroupAddon>
              <Icons.search />
            </InputGroupAddon>
            <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))}
            />
          </InputGroup>
        </div>
        <ScrollArea className={`h-[40vh] bg-popover`}>
					<div className='p-2 grid justify-items-center'>
					{(users?.pages[0] && users?.pages[0].pagination.total_results > 0) ? (
						users.pages.map((page, i) => (
							page.data.map((user, index) => (
								<div
								key={index}
								className='w-full flex cursor-pointer items-center justify-between py-1.5 px-2 hover:bg-accent rounded-sm'
								onClick={() => {
									if (selectedUsers.some((selectedUser) => selectedUser?.id === user?.id)) {
										return setSelectedUsers((prev) => prev.filter(
											(selectUser) => selectUser?.id !== user?.id
										))
									}
									return setSelectedUsers((prev) => [...prev, user]);
								}}
								{...(i === users.pages.length - 1 && index === page.data.length - 1
									? { ref: ref }
									: {})}
								>
									<div className="flex items-center">
										<UserAvatar avatarUrl={user.avatar_url} username={user.username!} />
										<div className="ml-2">
										<p className="text-sm font-medium leading-none line-clamp-1">
											{user.full_name}
										</p>
										<p className="text-sm text-muted-foreground line-clamp-1">
											@{user.username}
										</p>
										</div>
									</div>
									<Check size={20} className={`text-primary ${!selectedUsers.some((selectedUser) => selectedUser?.id === user?.id) ? 'opacity-0' : ''}`} />
								</div>
							))
						))
					) : isError ? (
						<div className='p-4 text-center text-muted-foreground'>
						{upperFirst(t('common.messages.an_error_occurred'))}
						</div>
					) : (searchQuery && !isLoading) ? (
						<div className='p-4 text-center text-muted-foreground'>
						{upperFirst(t('common.messages.no_user_found'))}
						</div>
					) : !isLoading ? (
						<div className='p-4 text-center text-muted-foreground'>
						{upperFirst(t('common.messages.search_user', { count: 1 }))}
						</div>
					) : null}
					 {(isLoading || isFetchingNextPage) ? <Icons.loader /> : null}
					</div>
				</ScrollArea>
      </ModalBody>
      <ModalFooter className="flex items-center p-4 sm:justify-between">
				{selectedUsers.length > 0 ? (
				<ScrollArea className='w-full'>
          <div className="flex -space-x-2">
            {selectedUsers.map((friend) => (
              <UserAvatar
                key={friend?.id}
                avatarUrl={friend?.avatar_url}
                username={friend?.username!}
                className='cursor-not-allowed'
                onClick={() => setSelectedUsers((prev) => prev.filter(
                  (selectedUser) => selectedUser?.id !== friend?.id
                ))}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
				</ScrollArea>
				) : (
				<p className="text-sm text-muted-foreground">
					{upperFirst(t('common.messages.select_users_to_add_to_playlist'))}
				</p>
				)}
				<Button
				disabled={!selectedUsers.length || isPending}
				onClick={handleAddGuest}
        className='shrink-0'
				>
				{isPending && <Icons.loader className="mr-2" />}	
				{upperFirst(t('common.messages.send'))}
				</Button>
			</ModalFooter>
    </>
  )
}

interface PlaylistGuestModalProps extends ModalType {
  playlistId: number;
}

export function ModalPlaylistGuest({
  playlistId,
  ...props
} : PlaylistGuestModalProps) {
  const t = useTranslations();
  const { session } = useAuth();
  const { data: playlistGuest, isError } = useQuery(usePlaylistGuestsOptions({ playlistId }));
  const { closeModal } = useModal();
  const [view, setView] = useState<'guests' | 'add'>('guests');

  if (!session) return null;
  return (
    <Modal
    open={props.open}
    onOpenChange={(open) => !open && closeModal(props.id)}
    className={`
      gap-0 p-0 outline-hidden
    `}
    >
      {playlistGuest ? (
        view === 'guests' ? (
          <PlaylistGuestView playlistId={playlistId} playlistGuest={playlistGuest} setView={setView} />
        ) : (
          <PlaylistGuestAddView playlistId={playlistId} playlistGuest={playlistGuest} setView={setView} />
        )
      ) : isError ? (
        <p>{upperFirst(t('common.messages.an_error_occurred'))}</p>
      ) : null}
    </Modal>
  )
}
