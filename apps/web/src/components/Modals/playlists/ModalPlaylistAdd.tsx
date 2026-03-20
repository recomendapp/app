'use client'

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useModal } from '@/context/modal-context';
import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '../Modal';
import { Icons } from '@/config/icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { usePlaylistItemsAddMutation, userPlaylistsAddTargetsInfiniteOptions } from '@libs/query-client';
import { Playlist, PlaylistsAddTargetsControllerListAllData } from '@packages/api-js';
import useDebounce from '@/hooks/use-debounce';
import { useInView } from 'react-intersection-observer';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import { ModalPlaylist } from './ModalPlaylist';

const COMMENT_MAX_LENGTH = 180;

interface ModalPlaylistAddProps extends ModalType {
	mediaId: PlaylistsAddTargetsControllerListAllData['path']['media_id'];
	type: PlaylistsAddTargetsControllerListAllData['path']['type'];
	mediaTitle?: string | null;
}

export function ModalPlaylistAdd({
	mediaId,
	type,
	mediaTitle,
	...props
} : ModalPlaylistAddProps) {
	const { user } = useAuth();
	const t = useTranslations();
	const { openModal, closeModal } = useModal();
	const [selectedPlaylists, setSelectedPlaylists] = useState<Playlist[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery);
	const { ref, inView } = useInView(); 
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetching,
	} = useInfiniteQuery(userPlaylistsAddTargetsInfiniteOptions({
		userId: user?.id,
		mediaId: mediaId,
		type: type,
		...(debouncedSearch.length > 0 && {
			filters: {
				search: debouncedSearch,
			}
		})
	}));
	const playlists = data?.pages.flatMap((page) => page.data) ?? [];

	// Mutations
	const { mutateAsync: add, isPending } = usePlaylistItemsAddMutation({
		userId: user?.id,
	});
	// Form
	const playlistAddFormSchema = z.object({
		comment: z.string().max(COMMENT_MAX_LENGTH, { message: t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH }) }).optional(),
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

	const onSubmit = useCallback(async (data: PlaylistAddFormValues) => {
		await add({
			path: {
				media_id: mediaId,
				type: type,
			},
			body: {
				playlistIds: selectedPlaylists.map((playlist) => playlist.id),
				comment: data.comment || null,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.added', { gender: 'male', count: selectedPlaylists.length })));
				closeModal(props.id);
			},
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [mediaId, type, selectedPlaylists, add, t, closeModal, props.id]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	return (
		<Modal
		open={props.open}
		onOpenChange={(open) => !open && closeModal(props.id)}
		>
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
					<InputGroupAddon align="block-start" className='border-b py-1!'>
						<Icons.search className="text-muted-foreground" />
						<InputGroupInput placeholder={upperFirst(t('common.messages.search_playlist', { count: 1 }))} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
						<InputGroupButton
						variant={'outline'}
						onClick={() => openModal(ModalPlaylist, {
							onSave: (newPlaylist) => setSelectedPlaylists((prev) => [...prev, newPlaylist]),
						})}
						>
							<Icons.add />
							{upperFirst(t('common.messages.create_a_playlist', { count: 2 }))}
						</InputGroupButton>
					</InputGroupAddon>
					<InputGroupAddon align="block-end">
						<ScrollArea className="h-[30vh] w-full">
							<div className="space-y-2">
								{playlists?.map(({ alreadyAdded, ...playlist }, index) => (
									<Button
									key={playlist.id}
									variant={'ghost'}
									ref={index === playlists.length - 1 ? ref : undefined}
									className="w-full flex items-center justify-between text-left px-1"
									onClick={() => {
										if (selectedPlaylists.some((selectedPlaylist) => selectedPlaylist.id === playlist.id)) {
											return setSelectedPlaylists((prev) => prev.filter(
												(selectedPlaylist) => selectedPlaylist.id !== playlist.id
											))
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
													{upperFirst(t('common.messages.already_added', { count: 1, gender: 'male' }))}
												</Badge>
											)}
											<Check size={20} className={`text-primary ${!selectedPlaylists.some((selectedPlaylist) => selectedPlaylist.id === playlist.id) ? 'opacity-0' : ''}`} />
										</div>
									</Button>
								))}
								{isFetching ? (
									<div className="flex items-center justify-center p-4">
										<Icons.loader />
									</div>
								) : (
									<div ref={ref} />
								)}
							</div>
						</ScrollArea>
					</InputGroupAddon>
				</InputGroup>
			</ModalBody>
			<ModalFooter className='overflow-hidden'>
				<form onSubmit={handleSubmit(onSubmit)} className="w-full">
					<FormField
					control={control}
					name="comment"
					render={({ field }) => (
						<InputGroup className='relative'>
							<InputGroupTextarea
							placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
							aria-invalid={!!errors.comment}
							className='max-h-10'
							{...field}
							/>
							<InputGroupAddon align="block-end">
								<InputGroupText className={cn('text-muted-foreground text-xs min-w-12', !!errors.comment && 'text-destructive')}>
									{commentLength}/{COMMENT_MAX_LENGTH}
								</InputGroupText>
								<ScrollArea className='overflow-hidden'>
									{selectedPlaylists.length > 0 ? (
										<div className="flex -space-x-2 overflow-hidden shrink">
											{selectedPlaylists.map((playlist) => (
												<div
												key={playlist.id}
												className={`w-6 shadow-2xl cursor-not-allowed`}
												onClick={() => setSelectedPlaylists((prev) => prev.filter(
													(selectPlaylist) => selectPlaylist.id !== playlist.id
												))}
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
									<ScrollBar orientation='horizontal' />
								</ScrollArea>
								<InputGroupButton
								type='submit'
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
		</Modal>
	)
}
