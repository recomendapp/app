'use client'

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useModal } from '@/context/modal-context';
import { useCallback, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '@/components/Modals/Modal';
import { Icons } from '@/config/icons';
import { UserAvatar } from '@/components/User/UserAvatar';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userRecoSendInfiniteOptions, useUserRecoSendMutation } from '@libs/query-client';
import { UserSummary } from '@packages/api-js';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '@/components/ui/input-group';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { FormField } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import useDebounce from '@/hooks/use-debounce';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';

const COMMENT_MAX_LENGTH = 180;

interface ModalUserRecoSendProps extends ModalType {
	mediaId: number;
	mediaType: 'movie' | 'tv_series';
	mediaTitle?: string | null;
}

export const ModalRecoSend = ({
	mediaId,
	mediaType,
	mediaTitle,
	...props
} : ModalUserRecoSendProps) => {
	const t = useTranslations();
	const { user } = useAuth();
	const { closeModal } = useModal();
	const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery);
	const { ref, inView } = useInView(); 
	const {
		data: data,
		fetchNextPage,
		hasNextPage,
		isFetching,
	} = useInfiniteQuery(userRecoSendInfiniteOptions({
		userId: user?.id,
		mediaId: mediaId,
		mediaType: mediaType,
		...(debouncedSearch.length > 0 && {
			filters: {
				search: debouncedSearch,
			}
		})
	}));
	const totalFriends = data?.pages[0].meta.total_results;
	const friends = data?.pages.flatMap((page) => page.data) ?? [];
	const { mutateAsync: send, isPending } = useUserRecoSendMutation();

	// Form
	const recoSendFormSchema = z.object({
		comment: z.string().max(COMMENT_MAX_LENGTH, { message: t('common.form.length.char_max', { count: COMMENT_MAX_LENGTH }) }).optional(),
	});
	type RecoSendFormValues = z.infer<typeof recoSendFormSchema>;

	const {
		watch,
		handleSubmit,
		formState: { errors },
		control,
	 } = useForm<RecoSendFormValues>({
		resolver: zodResolver(recoSendFormSchema),
		mode: 'onChange',
	});
	const commentLength = watch('comment')?.length || 0;


	const onSubmit = useCallback(async (data: RecoSendFormValues) => {
		await send({
			path: {
				media_id: mediaId,
				type: mediaType,
			},
			body: {
				userIds: selectedUsers.map((user) => user.id),
				comment: data.comment,
			}
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.sent', { count: selectedUsers.length, gender: 'female' })));
				closeModal(props.id);
			},
			onError: (error) => {
				toast.error(error.message || upperFirst(t('common.messages.error_occurred')));
			}
		});
	}, [mediaId, mediaType, selectedUsers, send, t, closeModal, props.id]);

	useEffect(() => {
		if (inView && hasNextPage) fetchNextPage();
	}, [inView, hasNextPage, fetchNextPage]);

	return (
		<Modal
		open={props.open}
		onOpenChange={(open) => !open && closeModal(props.id)}
		>
			<ModalHeader>
				<ModalTitle>{upperFirst(t('common.messages.send_to_friend'))}</ModalTitle>
				{mediaTitle && <ModalDescription>
					{t.rich('common.messages.recommend_to_friend_to_discover', {
						title: mediaTitle,
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</ModalDescription>}
			</ModalHeader>
			<ModalBody>
				<InputGroup>
					<InputGroupAddon align="block-start" className='border-b py-1!'>
						<Icons.search className="text-muted-foreground" />
						<InputGroupInput placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
						{totalFriends !== undefined && (
							<InputGroupAddon align="inline-end">{totalFriends}</InputGroupAddon>
						)}
					</InputGroupAddon>
					<InputGroupAddon align="block-end">
						<ScrollArea className="h-[30vh] w-full">
							<div className="space-y-2">
								{friends?.map(({ alreadySeen, alreadySent, ...friend }, index) => (
									<Button
									key={friend.id}
									variant={'ghost'}
									disabled={alreadySeen}
									ref={index === friends.length - 1 ? ref : undefined}
									className="w-full flex items-center justify-between text-left px-1"
									onClick={() => {
										if (selectedUsers.some((selectedUser) => selectedUser?.id === friend?.id)) {
											return setSelectedUsers((prev) => prev.filter(
												(selectedUser) => selectedUser?.id !== friend?.id
											))
										}
										return setSelectedUsers((prev) => [...prev, friend]);
									}}
									>
										<div className="flex items-center">
											<UserAvatar avatarUrl={friend.avatar} username={friend.username} />
											<div className="ml-2 ">
												<p className="text-sm font-medium leading-none line-clamp-1">
													{friend.name}
												</p>
												<p className="text-sm line-clamp-1">
													@{friend.username}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											{alreadySent && (
												<Badge variant="accent-yellow">
													{upperFirst(t('common.messages.already_sent'))}
												</Badge>
											)}
											{alreadySeen && (
												<Badge variant="destructive">
													{upperFirst(t('common.messages.already_watched'))}
												</Badge>
											)}
											<Check size={20} className={`text-primary ${!selectedUsers.some((selectedUser) => selectedUser?.id === friend?.id) ? 'opacity-0' : ''}`} />
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
									{selectedUsers.length > 0 ? (
										<div className="flex -space-x-2 overflow-hidden shrink">
											{selectedUsers.map((friend) => (
												<UserAvatar
													key={friend.id}
													avatarUrl={friend.avatar}
													username={friend.username}
													className='cursor-not-allowed w-6 h-6'
													onClick={() => setSelectedUsers((prev) => prev.filter(
														(selectedUser) => selectedUser?.id !== friend.id
													))}
												/>
											))}
										</div>
									) : (
										<p className="text-sm text-muted-foreground line-clamp-1">
											{upperFirst(t('common.messages.select_users_to_send_reco'))}
										</p>
									)}
									<ScrollBar orientation='horizontal' />
								</ScrollArea>
								<InputGroupButton
								type='submit'
								className="ml-auto"
								variant="default"
								disabled={!selectedUsers.length || isPending || !!errors.comment}
								>
									{upperFirst(t('common.messages.send'))}
									{!isPending ? <Icons.send /> : <Icons.loader />}
								</InputGroupButton>
							</InputGroupAddon>
						</InputGroup>
					)}
					/>
				</form>
			</ModalFooter>
		</Modal>
	);
};
