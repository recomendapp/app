'use client';

import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { Modal, ModalBody, ModalDescription, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Icons } from '@/config/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { playlistMembersAllOptions, usePlaylistMembersDeleteMutation, usePlaylistMemberUpdateMutation } from '@libs/query-client';
import { ApiError, Playlist, PlaylistMemberUpdate } from '@packages/api-js';
import Fuse from 'fuse.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlaylistMembers } from '@/hooks/use-playlist-members';
import { useTranslations } from 'next-intl';
import { ModalPlaylistMembersAdd } from './ModalPlaylistMembersAdd';
import toast from 'react-hot-toast';

interface ModalPlaylistMembersProps extends ModalType {
  playlist: Playlist;
}

export function ModalPlaylistMembers({
  playlist,
  ...props
} : ModalPlaylistMembersProps) {
  const { user } = useAuth();
  const { closeModal, openModal } = useModal();
  const t = useTranslations();
  const { playlistMembersRoleValues } = usePlaylistMembers();

  // Queries
  const { data: members } = useQuery(playlistMembersAllOptions({
    playlistId: playlist.id,
  }));

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
      return members || [];
    }
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, members, fuse]);

  // Handlers
  const handleUpdateMember = useCallback(async (userId: string, dto: PlaylistMemberUpdate) => {
    await updateMember({
      path: {
        playlist_id: playlist.id,
        user_id: userId,
      },
      body: dto,
    }, {
      onError: (error: ApiError) => {
        switch (error.statusCode) {
          case 403:
            toast.error(t('common.messages.you_dont_have_permission_to_do_this_action'));
            break;
          default:
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
            break;
        }
      }
    });
  }, [updateMember, playlist.id, t]);
  const handleDeleteMember = useCallback(async (userId: string) => {
    await deleteMember({
      path: {
        playlist_id: playlist.id,
      },
      body: {
        userIds: [userId],
      }
    }, {
      onError: () => {
        toast.error(upperFirst(t('common.messages.an_error_occurred')));
      }
    });
  }, [deleteMember, playlist.id, t]);

  return (
    <Modal
    open={props.open}
    onOpenChange={(open) => !open && closeModal(props.id)}
    >
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
            <InputGroupButton variant={'outline'} onClick={() => openModal(ModalPlaylistMembersAdd, { playlist: playlist })}>
              <Icons.add />
              {upperFirst(t('common.messages.add_member', { count: 2 }))}
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupAddon align="block-end">
            <ScrollArea className="h-[30vh] w-full">
              <div className="space-y-2">
                {results.length ? (
                  results?.map(({ user, ...item }) => (
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
              </div>
            </ScrollArea>
          </InputGroupAddon>
        </InputGroup>
      </ModalBody>
    </Modal>
  )
}
