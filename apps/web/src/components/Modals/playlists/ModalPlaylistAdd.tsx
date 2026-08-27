'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@libs/ui/components/button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { AspectRatio } from '@libs/ui/components/aspect-ratio';
import { Badge } from '@libs/ui/components/badge';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '../Modal';
import { Icons } from '@/config/icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import {
  movieOptions,
  tvSeriesOptions,
  usePlaylistItemsAddMutation,
  userPlaylistsAddTargetsAllOptions,
} from '@libs/query-client';
import { Playlist, PlaylistsAddTargetsControllerListAllData } from '@libs/api-js';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@libs/ui/components/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@libs/ui/components/input-group';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@libs/ui/components/scroll-area';
import toast from 'react-hot-toast';
import { ModalPlaylist } from './ModalPlaylist';
import Fuse from 'fuse.js';

const COMMENT_MAX_LENGTH = 180;

interface ModalPlaylistAddProps {
  mediaId: PlaylistsAddTargetsControllerListAllData['path']['media_id'];
  type: 'movie' | 'tv_series';
  /** Skips the title fetch below when the caller already has it on hand. */
  mediaTitle?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseEnd?: () => void;
}

export function ModalPlaylistAdd({
  mediaId,
  type,
  mediaTitle: mediaTitleProp,
  open,
  onOpenChange,
  onCloseEnd,
}: ModalPlaylistAddProps) {
  const { user, session } = useAuth();
  const t = useTranslations();
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Playlist[]>([]);
  const {
    data: playlists,
    isFetching,
    isError: isPlaylistsError,
  } = useQuery(
    userPlaylistsAddTargetsAllOptions({
      userId: user?.id,
      mediaId: mediaId,
      type: type,
    }),
  );

  const { data: movie, isError: isMovieError } = useQuery({
    ...movieOptions({ movieId: type === 'movie' ? mediaId : undefined }),
    enabled: type === 'movie' && mediaTitleProp === undefined,
  });
  const { data: tvSeries, isError: isTvSeriesError } = useQuery({
    ...tvSeriesOptions({ tvSeriesId: type === 'tv_series' ? mediaId : undefined }),
    enabled: type === 'tv_series' && mediaTitleProp === undefined,
  });
  const mediaTitle = mediaTitleProp ?? (type === 'movie' ? movie?.title : tvSeries?.name);

  useEffect(() => {
    if (!session) {
      onOpenChange(false);
      onCloseEnd?.();
      return;
    }
    if (isPlaylistsError || isMovieError || isTvSeriesError) {
      onOpenChange(false);
    }
  }, [session, isPlaylistsError, isMovieError, isTvSeriesError, onOpenChange, onCloseEnd]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const fuse = useMemo(() => {
    return new Fuse(playlists || [], {
      keys: ['title', 'owner.username', 'owner.name'],
      threshold: 0.5,
    });
  }, [playlists]);
  const results = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return playlists || [];
    }
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, playlists, fuse]);

  // Mutations
  const { mutateAsync: add, isPending } = usePlaylistItemsAddMutation();
  // Form
  const playlistAddFormSchema = z.object({
    comment: z
      .string()
      .max(COMMENT_MAX_LENGTH, {
        message: t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH }),
      })
      .optional(),
  });
  type PlaylistAddFormValues = z.infer<typeof playlistAddFormSchema>;

  const {
    watch,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<PlaylistAddFormValues>({
    resolver: zodResolver(playlistAddFormSchema),
    mode: 'onChange',
  });
  const commentLength = watch('comment')?.length || 0;

  const onSubmit = useCallback(
    async (data: PlaylistAddFormValues) => {
      await add(
        {
          path: {
            media_id: mediaId,
            type: type,
          },
          body: {
            playlistIds: selectedPlaylists.map((playlist) => playlist.id),
            comment: data.comment || null,
          },
        },
        {
          onSuccess: () => {
            toast.success(
              upperFirst(
                t('common.messages.added', { gender: 'male', count: selectedPlaylists.length }),
              ),
            );
            onOpenChange(false);
          },
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [mediaId, type, selectedPlaylists, add, t, onOpenChange],
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} onCloseEnd={onCloseEnd}>
      <ModalHeader>
        <ModalTitle>{upperFirst(t('common.messages.add_to_playlist'))}</ModalTitle>
        <ModalDescription>
          {t.rich('common.messages.add_to_one_or_more_playlists', {
            title: mediaTitle || '',
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <InputGroup>
          <InputGroupAddon align="block-start" className="border-b py-1!">
            <Icons.search className="text-muted-foreground" />
            <InputGroupInput
              placeholder={upperFirst(t('common.messages.search_playlist', { count: 1 }))}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupButton variant={'outline'} onClick={() => setIsCreatePlaylistOpen(true)}>
              <Icons.add />
              {upperFirst(t('common.messages.create_a_playlist', { count: 2 }))}
            </InputGroupButton>
          </InputGroupAddon>
          <InputGroupAddon align="block-end">
            <ScrollArea className="h-[30vh] w-full">
              <div className="space-y-2">
                {results?.map(({ alreadyAdded, ...playlist }) => (
                  <Button
                    key={playlist.id}
                    variant={'ghost'}
                    className="w-full flex items-center justify-between text-left px-1"
                    onClick={() => {
                      if (
                        selectedPlaylists.some(
                          (selectedPlaylist) => selectedPlaylist.id === playlist.id,
                        )
                      ) {
                        return setSelectedPlaylists((prev) =>
                          prev.filter((selectedPlaylist) => selectedPlaylist.id !== playlist.id),
                        );
                      }
                      return setSelectedPlaylists((prev) => [...prev, playlist]);
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 shadow-2xl shrink-0`}>
                        <AspectRatio ratio={1 / 1}>
                          <ImageWithFallback
                            src={playlist.poster ?? ''}
                            alt={playlist.title ?? ''}
                            fill
                            className="rounded-md object-cover"
                            type="playlist"
                          />
                        </AspectRatio>
                      </div>
                      <div className="ml-2 ">
                        <p className="text-sm font-medium leading-none line-clamp-1">
                          {playlist.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          @{playlist.owner.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {alreadyAdded && (
                        <Badge variant="accent-yellow">
                          {upperFirst(
                            t('common.messages.already_added', { count: 1, gender: 'male' }),
                          )}
                        </Badge>
                      )}
                      <Check
                        size={20}
                        className={`text-primary ${!selectedPlaylists.some((selectedPlaylist) => selectedPlaylist.id === playlist.id) ? 'opacity-0' : ''}`}
                      />
                    </div>
                  </Button>
                ))}
                {isFetching && (
                  <div className="flex items-center justify-center p-4">
                    <Icons.loader />
                  </div>
                )}
              </div>
            </ScrollArea>
          </InputGroupAddon>
        </InputGroup>
      </ModalBody>
      <ModalFooter className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={control}
            name="comment"
            render={({ field }) => (
              <InputGroup className="relative">
                <InputGroupTextarea
                  placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
                  aria-invalid={!!errors.comment}
                  className="max-h-10"
                  {...field}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText
                    className={cn(
                      'text-muted-foreground text-xs min-w-12',
                      !!errors.comment && 'text-destructive',
                    )}
                  >
                    {commentLength}/{COMMENT_MAX_LENGTH}
                  </InputGroupText>
                  <ScrollArea className="overflow-hidden">
                    {selectedPlaylists.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden shrink">
                        {selectedPlaylists.map((playlist) => (
                          <div
                            key={playlist.id}
                            className={`w-6 shadow-2xl cursor-not-allowed`}
                            onClick={() =>
                              setSelectedPlaylists((prev) =>
                                prev.filter((selectPlaylist) => selectPlaylist.id !== playlist.id),
                              )
                            }
                          >
                            <AspectRatio ratio={1 / 1}>
                              <ImageWithFallback
                                src={playlist.poster ?? ''}
                                alt={playlist.title ?? ''}
                                fill
                                className="rounded-xs object-cover"
                                type="playlist"
                              />
                            </AspectRatio>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {upperFirst(t('common.messages.select_playlists_to_add_the_item'))}
                      </p>
                    )}
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  <InputGroupButton
                    type="submit"
                    className="ml-auto"
                    variant="default"
                    disabled={!selectedPlaylists.length || isPending || !!errors.comment}
                  >
                    {upperFirst(t('common.messages.add'))}
                    {!isPending ? <Icons.add /> : <Icons.loader />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            )}
          />
        </form>
      </ModalFooter>
      {isCreatePlaylistOpen && (
        <ModalPlaylist
          open={isCreatePlaylistOpen}
          onOpenChange={setIsCreatePlaylistOpen}
          onSave={(newPlaylist) => setSelectedPlaylists((prev) => [...prev, newPlaylist])}
        />
      )}
    </Modal>
  );
}
