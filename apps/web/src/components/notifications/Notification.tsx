import { Notification as NotificationType } from '@novu/react';
import { forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { ReactMarkdown } from '../utils/ReactMarkdown';
import { CircleIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Icons } from '@/config/icons';
import { TooltipBox } from '../Box/TooltipBox';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { NotificationPayload } from '@recomendapp/types';
import { useUserAcceptFollowerRequestMutation, useUserDeclineFollowerRequestMutation } from '@/api/client/mutations/userMutations';

interface NotificationProps extends React.HTMLAttributes<HTMLDivElement | HTMLAnchorElement> {
	notification: NotificationType;
}

const NotificationContent = ({ notification }: { notification: NotificationType }) => {
	const t = useTranslations('common');
	const { mutateAsync: acceptRequest } = useUserAcceptFollowerRequestMutation();
	const { mutateAsync: declineRequest } = useUserDeclineFollowerRequestMutation();

	const handleAction = useCallback(async ({
		action,
		data,
	} : {
		action: 'primary' | 'secondary';
		data: NotificationPayload | undefined;
	}) => {
		if (!data) return toast.error(upperFirst(t('messages.an_error_occurred')));
		switch (data.type) {
			case 'follower_request':
				if (action === 'primary') {
					await acceptRequest({
						requestId: data.id
					}, {
						onSuccess: () => {
							toast.success(upperFirst(t('messages.request_accepted', { count: 1 })));
							notification.completePrimary();
						}, onError: () => {
							toast.error(upperFirst(t('messages.an_error_occurred')))
						}
					});
				} else {
					await declineRequest({
						requestId: data.id
					}, {
						onSuccess: () => {
							toast.success(upperFirst(t('messages.request_declined', { count: 1 })));
							notification.completeSecondary();
						}, onError: () => {
							toast.error(upperFirst(t('messages.an_error_occurred')));
						}
					});
				}
				break;
			default:
				break;
		}
	}, [acceptRequest, declineRequest, notification, t]);
	return (
		<div className='flex gap-2'>
			<div className='h-10 relative shrink-0 rounded-md overflow-hidden aspect-square'>
				<ImageWithFallback
					src={notification.avatar ?? ''}
					alt={notification.subject ?? ''}
					fill
					className="object-cover"
					sizes={`
					(max-width: 640px) 96px,
					(max-width: 1024px) 120px,
					150px
					`}
				/>
			</div>
			<div className='space-y-2'>
				<div className='line-clamp-6 wrap-break-word'>
					<ReactMarkdown>
					{notification.body}
					</ReactMarkdown>
				</div>
				{(notification.primaryAction || notification.secondaryAction) && (!notification.primaryAction?.isCompleted && !notification.secondaryAction?.isCompleted) ? (
					<div className='flex gap-2'>
						{(notification.primaryAction && !notification.primaryAction.isCompleted) ? (
							<Button
							onClick={async () => {
								await handleAction({
									action: 'primary',
									data: notification.data as NotificationPayload | undefined,
								});
							}}
							>
								{notification.primaryAction.label}
							</Button>
						) : null}
						{(notification.secondaryAction && !notification.secondaryAction.isCompleted) ? (
							<Button
							variant='outline'
							onClick={async () => {
								await handleAction({
									action: 'secondary',
									data: notification.data as NotificationPayload | undefined,
								});
							}}
							>
								{notification.secondaryAction.label}
							</Button>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	)
}

export const NotificationSkeleton = () => {
	return (
		<div className='flex justify-between gap-2 p-2'>
			<div className='flex gap-2'>
				<Skeleton className='h-10 w-10 rounded-md shrink-0' />
				<Skeleton className='h-10 w-40' />
			</div>
			<div className='flex flex-col gap-2 shrink-0'>
				<Skeleton className='h-4 w-4 rounded-full' />
				<Skeleton className='h-4 w-4 rounded-full' />
			</div>
		</div>
	);
}

export const Notification = forwardRef<
	HTMLDivElement,
	NotificationProps
>(({ className, onClick, notification, ...props }, ref) => {
	const t = useTranslations('common');
	return (
		<div
		ref={ref as React.RefObject<HTMLDivElement>}
		className={cn(
			"relative flex justify-between gap-2 text-sm cursor-pointer hover:bg-muted p-2",
			className
		)}
		onClick={(e) => {
			if (!notification.isRead) {
				notification.read();
			}
			onClick && onClick(e);
		}}
		{...props}
		>
			<NotificationContent notification={notification} />
			<div className='flex flex-col shrink-0'>
			{notification.isArchived ? (
				<>
				<TooltipBox tooltip={upperFirst(t('messages.unarchive'))}>
					<Button
					variant='ghost'
					size={'icon'}
					className='h-8 w-8 rounded-full'
					onClick={() => notification.unarchive()}
					>
						<Icons.archiveRestore size={14} />
					</Button>
				</TooltipBox>
				</>
			) : (
				<>
				<TooltipBox tooltip={notification.isRead ? upperFirst(t('messages.mark_as_unread', { count: 1, gender: 'female' })) : upperFirst(t('messages.mark_as_read', { count: 1, gender: 'female' }))}>
					<Button
					variant='ghost'
					size={'icon'}
					className='h-8 w-8 rounded-full'
					onClick={() => notification.isRead ? notification.unread() : notification.read()}
					>
						<Icons.check size={14} />
					</Button>
				</TooltipBox>
				<TooltipBox tooltip={upperFirst(t('messages.archive'))}>
					<Button
					variant='ghost'
					size={'icon'}
					className='h-8 w-8 rounded-full'
					onClick={() => notification.archive()}
					>
						<Icons.archive size={14} />
					</Button>
				</TooltipBox>
				</>
			)}
			</div>
			{!notification.isRead ? (
				<CircleIcon size={8} className='absolute top-1 left-1 text-accent-yellow fill-accent-yellow'/>
			) : null}
		</div>
	)
});
Notification.displayName = 'Notification';