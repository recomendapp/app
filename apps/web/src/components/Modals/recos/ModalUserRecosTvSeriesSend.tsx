'use client'

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useModal } from '@/context/modal-context';
import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@recomendapp/types';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalType } from '@/components/Modals/Modal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Icons } from '@/config/icons';
import { UserAvatar } from '@/components/User/UserAvatar';
import { Label } from '@/components/ui/label';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useUserRecosTvSeriesSendOptions } from '@/api/client/options/userOptions';
import { useUserRecosTvSeriesInsertMutation } from '@/api/client/mutations/userMutations';

const COMMENT_MAX_LENGTH = 180;

interface ModalUserRecosTvSeriesSendProps extends ModalType {
	tvSeriesId: number;
	tvSeriesTitle: string;
}

export function ModalUserRecosTvSeriesSend({
	tvSeriesId,
	tvSeriesTitle,
	...props
} : ModalUserRecosTvSeriesSendProps) {
	const t = useTranslations();
	const { session } = useAuth();
	const { closeModal } = useModal();
	const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
	const [comment, setComment] = useState<string>('');
	const {
		data: friends,
		isLoading,
	} = useQuery(useUserRecosTvSeriesSendOptions({
		userId: session?.user.id,
		tvSeriesId: tvSeriesId,
	}));
	const { mutateAsync: sendTvSeries, isPending } = useUserRecosTvSeriesInsertMutation();

	const handleSubmit = useCallback(async () => {
		if (!session || !tvSeriesId) return;
		await sendTvSeries({
			senderId: session.user.id,
			tvSeriesId: tvSeriesId,
			receivers: selectedUsers,
			comment: comment,
		}, {
			onSuccess: () => {
				toast.success(upperFirst(t('common.messages.sent', { count: selectedUsers.length, gender: 'female' })));
				closeModal(props.id);
			},
			onError: (error: any) => {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					switch (error.code) {
						default:
							toast.error(error.message);
							break;
					}
				}
			}
		});
	}, [session, tvSeriesId, selectedUsers, comment, sendTvSeries, t, closeModal, props.id]);

	return (
		<Modal
			open={props.open}
			onOpenChange={(open) => !open && closeModal(props.id)}
			className='gap-0 p-0 outline-hidden'
		>
			<ModalHeader className='px-4 pb-4 pt-5'>
				<ModalTitle>{upperFirst(t('common.messages.send_to_friend'))}</ModalTitle>
				<ModalDescription>
					{t.rich('common.messages.recommend_to_friend_to_discover', {
						title: tvSeriesTitle,
						strong: (chunks) => <strong>{chunks}</strong>,
					})}
				</ModalDescription>
			</ModalHeader>
			<ModalBody className='p-0! overflow-hidden'>
				<Command className="overflow-hidden rounded-t-none border-t">
					<CommandInput placeholder={upperFirst(t('common.messages.search_user', { count: 1 }))} />
					<CommandList>
						{isLoading && (
							<div className="flex items-center justify-center p-4">
								<Icons.loader />
							</div>
						)}
						<CommandEmpty>{upperFirst(t('common.messages.no_user_found'))}</CommandEmpty>
						<CommandGroup className="p-2">
							{friends?.map(({friend, as_watched, already_sent}) => (
								<CommandItem
									key={friend.id}
									value={`@${friend.full_name} ${friend.username}`}
									className="flex items-center justify-between px-2"
									onSelect={() => {
										if (selectedUsers.some((selectedUser) => selectedUser?.id === friend?.id)) {
											return setSelectedUsers((prev) => prev.filter(
												(selectedUser) => selectedUser?.id !== friend?.id
											))
										}
										return setSelectedUsers((prev) => [...prev, friend]);
									}}
								>
									<div className="flex items-center">
										<UserAvatar avatarUrl={friend.avatar_url} username={friend.username!} />
										<div className="ml-2">
										<p className="text-sm font-medium leading-none line-clamp-1">
											{friend.full_name}
										</p>
										<p className="text-sm text-muted-foreground line-clamp-1">
											@{friend.username}
										</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{already_sent && (
											<Badge variant="accent-yellow">
												{upperFirst(t('common.messages.already_sent'))}
											</Badge>
										)}
										{as_watched && (
											<Badge variant="destructive">
												{upperFirst(t('common.messages.already_watched'))}
											</Badge>
										)}
										<Check size={20} className={`text-primary ${!selectedUsers.some((selectedUser) => selectedUser?.id === friend?.id) ? 'opacity-0' : ''}`} />
									</div>
								</CommandItem>
							))}
						</CommandGroup>
						</CommandList>
				</Command>
			</ModalBody>
			<div className='px-2 pt-2'>
				<Label htmlFor="comment" className='sr-only'>{upperFirst(t('common.messages.comment', { count: 1 }))}</Label>
				<Input
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder={upperFirst(t('common.messages.add_comment', { count: 1 }))}
				maxLength={COMMENT_MAX_LENGTH}
				/>
			</div>
			<ModalFooter className="flex items-center p-4 sm:justify-between">
				{selectedUsers.length > 0 ? (
				<div className="flex -space-x-2 overflow-hidden">
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
				) : (
				<p className="text-sm text-muted-foreground">
					{upperFirst(t('common.messages.select_users_to_send_reco'))}
				</p>
				)}
				<Button
				disabled={!selectedUsers.length || isPending}
				onClick={handleSubmit}
				>
				{isPending && <Icons.loader className="mr-2" />}
				{upperFirst(t('common.messages.send'))}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
