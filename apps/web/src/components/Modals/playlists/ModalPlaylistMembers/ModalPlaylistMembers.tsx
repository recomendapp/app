'use client';

import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../../Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlaylistMembersTable } from './components/table/table';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, Check } from 'lucide-react';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Icons } from '@/config/icons';
import useDebounce from '@/hooks/use-debounce';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { playlistMembersAllOptions, usePlaylistMembersDeleteMutation, usePlaylistMemberUpdateMutation } from '@libs/query-client';
import { PlaylistMemberUpdate, PlaylistMemberWithUser, UserSummary } from '@packages/api-js';
import { CardUser } from '@/components/Card/CardUser';
import Fuse from 'fuse.js';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlaylistMembers } from '@/hooks/use-playlist-members';

export const PlaylistMembersView = ({
  members,
  playlistId,
  setView
} : {
  members: PlaylistMemberWithUser[],
  playlistId: number,
  setView: (view: 'manage' | 'add') => void
}) => {
  const { user } = useAuth();
  const t = useTranslations();
  const { playlistMembersRoleValues } = usePlaylistMembers();

  // Mutations
  const { mutateAsync: updateMember } = usePlaylistMemberUpdateMutation({
    userId: user?.id,
  });
  const { mutateAsync: deleteMember } = usePlaylistMembersDeleteMutation({
    userId: user?.id,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const fuse = useMemo(() => {
		return new Fuse(members || [], {
			keys: ['user.username', 'user.name'],
			threshold: 0.5,
		});
	}, [members]);
  const results = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return members;
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, members, fuse]);

  // Handlers
  const handleUpdateMember = useCallback(async (userId: string, dto: PlaylistMemberUpdate) => {
    await updateMember({
      path: {
        playlist_id: playlistId,
        user_id: userId,
      },
      body: dto,
    });
  }, [updateMember, playlistId]);
  const handleDeleteMember = useCallback(async (userId: string) => {
    await deleteMember({
      path: {
        playlist_id: playlistId,
      },
      body: {
        userIds: [userId],
      }
    });
  }, [deleteMember, playlistId]);

  return (
    <>
      <ModalHeader>
        <ModalTitle>
          {upperFirst(t('common.messages.manage_members'))}
        </ModalTitle>
        <ModalDescription>
          {upperFirst(t('common.messages.manage_playlist_access_rights'))}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <InputGroup>
          <InputGroupAddon align="block-start" className='border-b py-1!'>
            <Icons.search className="text-muted-foreground" />
            <InputGroupInput placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <InputGroupButton variant={'outline'} onClick={() => setView('add')}>
              {upperFirst(t('common.messages.add_member', { count: 2 }))}
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupAddon align="block-end">
            <ScrollArea className="h-[30vh] w-full">
              <div className="space-y-2">
                {results.length ? (
                  results?.map(({ user, ...item }, index) => (
                    <div
                    key={user.id}
                    className="w-full flex items-center justify-between text-left px-1"
                    >
                      <div className="flex items-center">
                        <UserAvatar avatarUrl={user.avatar} username={user.username} />
                        <div className="ml-2 ">
                          <p className="text-sm font-medium leading-none line-clamp-1">
                            {user.name}
                          </p>
                          <p className="text-sm line-clamp-1">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={item.role} onValueChange={(v) => handleUpdateMember(item.userId, { role: v as PlaylistMemberUpdate['role'] })}>
                          <SelectTrigger className="w-full max-w-48">
                            <SelectValue placeholder="Select a fruit" />
                          </SelectTrigger>
                          <SelectContent>
                            {playlistMembersRoleValues.map(({ value, label }) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon-sm" onClick={() => handleDeleteMember(item.userId)}>
                          <Icons.X />
                          <span className="sr-only">{upperFirst(t('common.messages.delete'))}</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {upperFirst(t('common.messages.no_user_found'))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {upperFirst(t('common.messages.no_member', { count: 1 }))}
                  </div>
                )}
                {/* {isFetching ? (
                  <div className="flex items-center justify-center p-4">
                    <Icons.loader />
                  </div>
                ) : (
                  <div ref={ref} />
                )} */}
              </div>
            </ScrollArea>
          </InputGroupAddon>
        </InputGroup>
      </ModalBody>
      {/* <ModalBody>
        {members ? (
          <PlaylistMembersTable playlistId={playlistId} members={members} setView={setView} />
        ) : null}
      </ModalBody> */}
    </>
  )
}

// export const PlaylistMembersAddView = ({
//   playlistId,
//   playlistGuest,
//   setView
// } : {
//   playlistId: number,
//   playlistGuest: PlaylistMemberWithUserDto[],
//   setView: (view: 'manage' | 'add') => void
// }) => {
//   const t = useTranslations();
//   const { user } = useAuth();
//   const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
//   const [search, setSearch] = useState<string>('');
//   const searchQuery = useDebounce(search, 500);
//   const { ref, inView } = useInView();

//   const {
// 		data: users,
// 		isLoading,
// 		isError,
// 		fetchNextPage,
// 		isFetchingNextPage,
// 		hasNextPage,
// 	} = useInfiniteQuery(usePlaylistMemberssAddOptions({
//     playlistId: playlistId,
//     filters: {
//       query: searchQuery,
//       exclude: playlistGuest.map((guest) => guest?.user_id as string).concat(session?.user.id as string)
//     }
//   }));
//   const { mutateAsync: addUsers, isPending } = usePlaylistMemberssInsertMutation({
//     playlistId: playlistId
//   });
  
//   const handleAddGuest = useCallback(async () => {
//     await addUsers({
//       playlistId,
//       userIds: selectedUsers.map((user) => user?.id as string)
//     }, {
//       onSuccess: () => {
//         toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectedUsers.length })));
//         setSelectedUsers([]);
//         setView('guests');
//       },
//       onError: () => {
//         toast.error(upperFirst(t('common.messages.an_error_occurred')));
//       }
//     });
//   }, [addUsers, playlistId, selectedUsers, setView, t]);

//   useEffect(() => {
// 		if (inView && hasNextPage) {
// 		  fetchNextPage();
// 		}
// 	}, [inView, hasNextPage, fetchNextPage]);

//   return (
//     <>
//       <ModalHeader className='px-4 pb-4 pt-5'>
//         <ModalTitle className='flex gap-4 items-center'>
//           <Button
//             variant="ghost"
//             size={'icon'}
//             onClick={() => setView('guests')}
//           >
//             <ArrowLeftIcon size={20} />
//             <span className='sr-only'>{upperFirst(t('common.messages.back'))}</span>
//           </Button>
//           {upperFirst(t('common.messages.add_member', { count: 2 }))}
//         </ModalTitle>
//         <ModalDescription className='text-left'>
//           {upperFirst(t('common.messages.add_guests_to_your_playlist'))}
//         </ModalDescription>
//       </ModalHeader>
//       <ModalBody>
//         <div className="px-4 mb-4">
//           <InputGroup>
//             <InputGroupAddon>
//               <Icons.search />
//             </InputGroupAddon>
//             <InputGroupInput
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))}
//             />
//           </InputGroup>
//         </div>
//         <ScrollArea className={`h-[40vh] bg-popover`}>
// 					<div className='p-2 grid justify-items-center'>
// 					{(users?.pages[0] && users?.pages[0].pagination.total_results > 0) ? (
// 						users.pages.map((page, i) => (
// 							page.data.map((user, index) => (
// 								<div
// 								key={index}
// 								className='w-full flex cursor-pointer items-center justify-between py-1.5 px-2 hover:bg-accent rounded-sm'
// 								onClick={() => {
// 									if (selectedUsers.some((selectedUser) => selectedUser?.id === user?.id)) {
// 										return setSelectedUsers((prev) => prev.filter(
// 											(selectUser) => selectUser?.id !== user?.id
// 										))
// 									}
// 									return setSelectedUsers((prev) => [...prev, user]);
// 								}}
// 								{...(i === users.pages.length - 1 && index === page.data.length - 1
// 									? { ref: ref }
// 									: {})}
// 								>
// 									<div className="flex items-center">
// 										<UserAvatar avatarUrl={user.avatar_url} username={user.username!} />
// 										<div className="ml-2">
// 										<p className="text-sm font-medium leading-none line-clamp-1">
// 											{user.full_name}
// 										</p>
// 										<p className="text-sm text-muted-foreground line-clamp-1">
// 											@{user.username}
// 										</p>
// 										</div>
// 									</div>
// 									<Check size={20} className={`text-primary ${!selectedUsers.some((selectedUser) => selectedUser?.id === user?.id) ? 'opacity-0' : ''}`} />
// 								</div>
// 							))
// 						))
// 					) : isError ? (
// 						<div className='p-4 text-center text-muted-foreground'>
// 						{upperFirst(t('common.messages.an_error_occurred'))}
// 						</div>
// 					) : (searchQuery && !isLoading) ? (
// 						<div className='p-4 text-center text-muted-foreground'>
// 						{upperFirst(t('common.messages.no_user_found'))}
// 						</div>
// 					) : !isLoading ? (
// 						<div className='p-4 text-center text-muted-foreground'>
// 						{upperFirst(t('common.messages.search_user', { count: 1 }))}
// 						</div>
// 					) : null}
// 					 {(isLoading || isFetchingNextPage) ? <Icons.loader /> : null}
// 					</div>
// 				</ScrollArea>
//       </ModalBody>
//       <ModalFooter className="flex items-center p-4 sm:justify-between">
// 				{selectedUsers.length > 0 ? (
// 				<ScrollArea className='w-full'>
//           <div className="flex -space-x-2">
//             {selectedUsers.map((friend) => (
//               <UserAvatar
//                 key={friend?.id}
//                 avatarUrl={friend?.avatar_url}
//                 username={friend?.username}
//                 className='cursor-not-allowed'
//                 onClick={() => setSelectedUsers((prev) => prev.filter(
//                   (selectedUser) => selectedUser?.id !== friend?.id
//                 ))}
//               />
//             ))}
//           </div>
//           <ScrollBar orientation="horizontal" />
// 				</ScrollArea>
// 				) : (
// 				<p className="text-sm text-muted-foreground">
// 					{upperFirst(t('common.messages.select_users_to_add_to_playlist'))}
// 				</p>
// 				)}
// 				<Button
// 				disabled={!selectedUsers.length || isPending}
// 				onClick={handleAddGuest}
//         className='shrink-0'
// 				>
// 				{isPending && <Icons.loader className="mr-2" />}	
// 				{upperFirst(t('common.messages.send'))}
// 				</Button>
// 			</ModalFooter>
//     </>
//   )
// }

interface ModalPlaylistMembersProps extends ModalType {
  playlistId: number;
}

export function ModalPlaylistMembers({
  playlistId,
  ...props
} : ModalPlaylistMembersProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const { data: members, isError } = useQuery(playlistMembersAllOptions({ playlistId }));
  const { closeModal } = useModal();
  const [view, setView] = useState<'manage' | 'add'>('manage');

  if (!user) return null;
  return (
    <Modal
    open={props.open}
    onOpenChange={(open) => !open && closeModal(props.id)}
    >
      {members ? (
        view === 'manage' ? (
          <PlaylistMembersView playlistId={playlistId} members={members} setView={setView} />
        ) : (
          <></>
          // <PlaylistMembersAddView playlistId={playlistId} members={members} setView={setView} />
        )
      ) : isError ? (
        <p>{upperFirst(t('common.messages.an_error_occurred'))}</p>
      ) : null}
    </Modal>
  )
}
