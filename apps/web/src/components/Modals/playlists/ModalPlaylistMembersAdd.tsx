'use client';

import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Icons } from '@/config/icons';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { playlistMembersAllOptions, searchUsersInfiniteOptions, usePlaylistMembersAddMutation } from '@libs/query-client';
import { Playlist, UserSummary } from '@packages/api-js';
import { Badge } from '@/components/ui/badge';
import useDebounce from '@/hooks/use-debounce';

interface ModalPlaylistMembersAddProps extends ModalType {
  playlist: Playlist;
}

export function ModalPlaylistMembersAdd({
  id,
  playlist,
  ...props
} : ModalPlaylistMembersAddProps) {
  const { closeModal } = useModal();
  const t = useTranslations();
  const { inView, ref } = useInView();

  const { data: members } = useQuery(playlistMembersAllOptions({
    playlistId: playlist.id,
  }));

  // Mutations
  const { mutateAsync: addMembers, isPending } = usePlaylistMembersAddMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
  const {
    data,
    isError,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(searchUsersInfiniteOptions({
    filters: {
      q: debouncedSearch,
    }
  }));
  const users = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page => page.data.map(user => ({
      ...user,
      alreadyAdded: members?.some(member => member.user.id === user.id),
    })));
  }, [data, members]);

  // Handlers
  const handleAddMembers = useCallback(async () => {
    await addMembers({
      path: {
        playlist_id: playlist.id,
      },
      body: {
        userIds: selectedUsers.map((user) => user.id),
      },
    }, {
      onSuccess: () => {
        toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectedUsers.length })));
        closeModal(id);
      },
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [addMembers, playlist.id, selectedUsers, t, closeModal, id]);

  useEffect(() => {
		if (inView && hasNextPage) {
		  fetchNextPage();
		}
	}, [inView, hasNextPage, fetchNextPage]);

  return (
    <Modal
    open={props.open}
    onOpenChange={(open) => !open && closeModal(id)}
    >
      <ModalHeader>
        <ModalTitle>{upperFirst(t('common.messages.add_member', { count: 2 }))}</ModalTitle>
        <ModalDescription className='text-left'>
          {upperFirst(t('common.messages.add_guests_to_your_playlist'))}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <InputGroup>
					<InputGroupAddon align="block-start" className='border-b py-1!'>
						<Icons.search className="text-muted-foreground" />
						<InputGroupInput placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
					</InputGroupAddon>
          <InputGroupAddon align="block-end">
            <ScrollArea className={`h-[40vh] w-full`}>
              <div className='space-y-2'>
              {(users.length > 0) ? (
                users.map(({ alreadyAdded, ...user }, i) => (
                  <Button
                  key={user.id}
                  variant={'ghost'}
                  disabled={alreadyAdded}
									className="w-full flex items-center justify-between text-left px-1"
                  onClick={() => {
                    if (selectedUsers.some((selectedUser) => selectedUser?.id === user?.id)) {
                      return setSelectedUsers((prev) => prev.filter(
                        (selectUser) => selectUser?.id !== user?.id
                      ))
                    }
                    return setSelectedUsers((prev) => [...prev, user]);
                  }}
                  {...(i === users.length - 1 ? { ref: ref } : {})}
                  >
                    <div className="flex items-center">
                      <UserAvatar avatarUrl={user.avatar} username={user.username} />
                      <div className="ml-2">
                      <p className="text-sm font-medium leading-none line-clamp-1">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        @{user.username}
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {alreadyAdded && (
                          <Badge variant="destructive">
                            {upperFirst(t('common.messages.already_added', { gender: 'male', count: 1 }))}
                          </Badge>
                      )}
                      <Check size={20} className={`text-primary ${!selectedUsers.some((selectedUser) => selectedUser?.id === user?.id) ? 'opacity-0' : ''}`} />
                    </div>
                  </Button>
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
          </InputGroupAddon>
        </InputGroup>
      </ModalBody>
      <ModalFooter>
				{selectedUsers.length > 0 ? (
				<ScrollArea className='w-full'>
          <div className="flex -space-x-2">
            {selectedUsers.map((friend) => (
              <UserAvatar
                key={friend?.id}
                avatarUrl={friend?.avatar}
                username={friend?.username}
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
				onClick={handleAddMembers}
        className='shrink-0'
				>
				{isPending && <Icons.loader className="mr-2" />}	
				{upperFirst(t('common.messages.add'))}
				</Button>
			</ModalFooter>
    </Modal>
  )
}
